// LICENSE : MIT
"use strict";
export default function (context) {
    let { Syntax, report, RuleError } = context;
    return {
        [Syntax.Str](node){
            return new Promise((resolve) => {
                setTimeout(()=> {
                    report(node, new RuleError("async error"));
                    resolve();
                }, 100);
            });
        }
    }
}
