// LICENSE : MIT
'use strict';
/*
    textlint-core.js is a class
    textlint.js is a singleton object that is instance of textlint-core.js.
 */
var Promise = require("bluebird");
var TraverseController = require('txt-ast-traverse').Controller;
var traverseController = new TraverseController();
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var RuleContext = require('./rule/rule-context');
var RuleContextAgent = require("./rule/rule-context-agent");
var debug = require('debug')('textlint:core');
var timing = require("./util/timing");
var proccesor_helper_1 = require("./util/proccesor-helper");
var textlint_plugin_markdown_1 = require("textlint-plugin-markdown");
var textlint_plugin_text_1 = require("textlint-plugin-text");
// add all the node types as listeners
function addListenRule(key, rule, target) {
    Object.keys(rule).forEach(function (nodeType) {
        target.on(nodeType, timing.enabled
            ? timing.time(key, rule[nodeType])
            : rule[nodeType]);
    });
}
var TextlintCore = (function () {
    function TextlintCore(config) {
        if (config === void 0) { config = {}; }
        // this.config often is undefined.
        this.config = config;
        this.rules = {};
        this.rulesConfig = {};
        // FIXME: in the future, this.processors is empty by default.
        // Markdown and Text are for backward compatibility.
        this.processors = [
            new textlint_plugin_markdown_1.Processor(config),
            new textlint_plugin_text_1.Processor(config)
        ];
    }
    // unstable API
    TextlintCore.prototype.addProcessor = function (Processtor) {
        // add first
        this.processors.unshift(new Processtor(this.config));
    };
    /**
     * Register rules to EventEmitter.
     * if want to release rules, please call {@link this.resetRules}.
     * @param {object} rules rule objects array
     * @param {object} [rulesConfig] ruleConfig is object
     */
    TextlintCore.prototype.setupRules = function (rules, rulesConfig) {
        if (rules === void 0) { rules = {}; }
        if (rulesConfig === void 0) { rulesConfig = {}; }
        var ignoreDisableRules = function (rules) {
            var resultRules = Object.create(null);
            Object.keys(rules).forEach(function (key) {
                var ruleCreator = rules[key];
                if (typeof ruleCreator !== 'function') {
                    throw new Error("Definition for rule '" + key + "' was not found.");
                }
                // "rule-name" : false => disable
                var ruleConfig = rulesConfig && rulesConfig[key];
                if (ruleConfig !== false) {
                    debug('use "%s" rule', key);
                    resultRules[key] = rules[key];
                }
            });
            return resultRules;
        };
        this.rules = ignoreDisableRules(rules);
        this.rulesConfig = rulesConfig;
    };
    TextlintCore.prototype._createRuleContextAgent = function (text, filePath) {
        var _this = this;
        var rules = this.rules;
        var ruleContextAgent = new RuleContextAgent(text, filePath);
        Object.keys(rules).forEach(function (key) {
            var ruleCreator = rules[key];
            var ruleConfig = _this.rulesConfig[key];
            try {
                var ruleContext = new RuleContext(key, ruleContextAgent, _this.config, ruleConfig);
                var rule = ruleCreator(ruleContext, ruleConfig);
                addListenRule(key, rule, ruleContextAgent);
            }
            catch (ex) {
                ex.message = "Error while loading rule '" + key + "': " + ex.message;
                throw ex;
            }
        });
        return ruleContextAgent;
    };
    /**
     * Remove all registered rule and clear messages.
     */
    TextlintCore.prototype.resetRules = function () {
        // noop
    };
    TextlintCore.prototype._lintByProcessor = function (processor, text, ext, filePath) {
        assert(processor, "processor is not found for " + ext);
        var _a = processor.processor(ext), preProcess = _a.preProcess, postProcess = _a.postProcess;
        assert(typeof preProcess === "function" && typeof postProcess === "function", "processor should implement {preProcess, postProcess}");
        var ast = preProcess(text, filePath);
        var promiseQueue = [];
        var ruleContextAgent = this._createRuleContextAgent(text, filePath);
        traverseController.traverse(ast, {
            enter: function (node, parent) {
                var type = node.type;
                Object.defineProperty(node, 'parent', { value: parent });
                if (ruleContextAgent.listenerCount(type) > 0) {
                    var promise = ruleContextAgent.emit(type, node);
                    promiseQueue.push(promise);
                }
            },
            leave: function (node) {
                var type = node.type + ":exit";
                if (ruleContextAgent.listenerCount(type) > 0) {
                    var promise = ruleContextAgent.emit(type, node);
                    promiseQueue.push(promise);
                }
            }
        });
        return Promise.all(promiseQueue).then(function () {
            var messages = ruleContextAgent.messages;
            var result = postProcess(messages, filePath);
            if (result.filePath == null) {
                result.filePath = "<Unkown" + ext + ">";
            }
            assert(result.filePath && result.messages.length >= 0, "postProcess should return { messages, filePath } ");
            return result;
        });
    };
    /**
     * lint text by registered rules.
     * The result contains target filePath and error messages.
     * @param {string} text
     * @param {string} ext ext is extension. default: .txt
     * @returns {TextLintResult}
     */
    TextlintCore.prototype.lintText = function (text, ext) {
        if (ext === void 0) { ext = ".txt"; }
        var processor = proccesor_helper_1.getProcessorMatchExtension(this.processors, ext);
        return this._lintByProcessor(processor, text, ext);
    };
    /**
     * lint markdown text by registered rules.
     * The result contains target filePath and error messages.
     * @param {string} text markdown format text
     * @returns {TextLintResult}
     */
    TextlintCore.prototype.lintMarkdown = function (text) {
        var ext = ".md";
        var processor = proccesor_helper_1.getProcessorMatchExtension(this.processors, ext);
        return this._lintByProcessor(processor, text, ext);
    };
    /**
     * lint file and return result object
     * @param {string} filePath
     * @returns {TextLintResult} result
     */
    TextlintCore.prototype.lintFile = function (filePath) {
        var absoluteFilePath = path.resolve(process.cwd(), filePath);
        var ext = path.extname(absoluteFilePath);
        var text = fs.readFileSync(absoluteFilePath, 'utf-8');
        var processor = proccesor_helper_1.getProcessorMatchExtension(this.processors, ext);
        return this._lintByProcessor(processor, text, ext, absoluteFilePath);
    };
    return TextlintCore;
}());
exports.__esModule = true;
exports["default"] = TextlintCore;
