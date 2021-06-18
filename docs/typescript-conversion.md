# TypeScript Conversion (June 2021)

## Errors flagged by ts-migrate

<!-- markdownlint-disable MD037 -->
|Error|Fixed|Description|Original Count|Current Count|
|-----|-----|-----------|-------------:|------------:|
|2304|:white_check_mark:|Cannot find name __.|78|0|
|2307|:white_check_mark:|Cannot find module __ or its corresponding type declarations.|12|0|
|2322||Type __ is not assignable to type __.|4|3|
|2339||Property __ does not exist on type 'Readonly<{}>'|2|2|
|2345||Argument of type __ is not assignable to parameter of type __.|3|3|
|2349||This expression is not callable.|1|1|
|2362||Type __ is not assignable to type __.|1|1|
|2376||A 'super' call must be the first statement in the constructor when a class contains initialized properties, parameter properties, or private identifiers.|1|1|
|2416||Property __ in type __ is not assignable to the same property in base type __.|2|1|
|2551|:white_check_mark:|Property __ does not exist on type __.|1|0|
|2554||Expected __ arguments, but got __.|168|5|
|2686|:white_check_mark:|__ refers to a UMD global, but the current file is a module.|18|0|
|2732|:white_check_mark:|Cannot find module __. Consider using '--resolveJsonModule' to import module with '.json' extension.|1|0|
|7006||Parameter __ implicitly has an 'any' type.|34|2|
|7010||__, which lacks return-type annotation, implicitly has an __ return type.|2|1|
|7011||Function expression, which lacks return-type annotation, implicitly has an 'any' return type.|2|1|
|7016|:white_check_mark:|Could not find a declaration file for module __|16|0|
|7018||Object literal's property __ implicitly has an 'any' type.|3|1|
|7022||__ implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.|1|1|
|7023||__ implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.|2|2|
|7024||__ implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.|1|1|
|7053||Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{}'|15|1|
|||**Grand Total**|359|27|
