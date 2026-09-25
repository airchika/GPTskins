"use strict";
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

function load(file, apiName, method, settings, failure) {
  let reads, writes;
  const context = vm.createContext({chrome: {
    runtime: {},
    storage: {sync: {
      get(keys, callback) {
        reads = keys;
        if (failure === "read") context.chrome.runtime.lastError = {message: "read failed"};
        callback({...settings});
        delete context.chrome.runtime.lastError;
      },
      set(values, callback) {
        writes = values;
        if (failure === "write") context.chrome.runtime.lastError = {message: "write failed"};
        callback();
        delete context.chrome.runtime.lastError;
      }
    }}
  }});
  vm.runInContext(fs.readFileSync(path.join(__dirname,"..",file),"utf8"),context);
  let result, error, calls = 0;
  context[apiName][method]((value, issue)=>{result=value; error=issue; calls++;});
  assert.equal(calls,1);
  assert.ok(reads.every(key=>!key.includes("theme")));
  return {result:JSON.parse(JSON.stringify(result)), writes:writes && JSON.parse(JSON.stringify(writes)), error};
}
const fontArgs = ["shared/fonts.js","GPTToolkitFonts","loadFontSettings"];
const settings = {"gpttoolkit.font.interface":"sarasa-ui-sc", "gptskins.font.text":"noto-serif-sc"};
let run = load(...fontArgs, settings);
assert.equal(run.result.interface,"sarasa-ui-sc");
assert.equal(run.result.text,"noto-serif-sc");
assert.equal(run.writes["gpttoolkit.font.interface"],undefined);
assert.equal(run.writes["gpttoolkit.font.text"],"noto-serif-sc");
assert.equal(load(...fontArgs,{...settings,...run.writes}).writes,undefined,"reload must not migrate again");
run = load(...fontArgs,settings,"read");
assert.equal(run.error,"read failed"); assert.equal(run.writes,undefined,"read errors must never overwrite stored values");
run = load(...fontArgs,settings,"write");
assert.equal(run.error,"write failed"); assert.equal(run.result.text,"noto-serif-sc","unsaved migration still resolves the selected font");
const toolArgs=["tools/shared.js","GPTToolkitTools","loadToolSettings"];
run=load(...toolArgs,{"gptskins.scrollGuard.enabled":false,"gpttoolkit.latexCopy.enabled":false});
assert.equal(run.result["gpttoolkit.scrollGuard.enabled"],false);
assert.equal(run.result["gpttoolkit.latexCopy.enabled"],false);
assert.equal(run.writes["gpttoolkit.latexCopy.enabled"],undefined);
assert.equal(load(...toolArgs,run.result).writes,undefined);
assert.equal(load(...toolArgs,{},"read").writes,undefined);
assert.equal(load(...toolArgs,{},"write").error,"write failed");
console.log("Checked storage loading, migration idempotence and read/write failure handling.");
