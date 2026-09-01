<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# 原创验证样张

本目录是 svg-facade 的**本仓库原创**样张集（此前迭代中手工编写的能力测试 SVG），每张对应
`../docs/README.md` 里若干条经实测标定的决策。清单与说明见
`index.json`（playground 的样张列表也从它读，新增样张记得同步登记）。

- 回归：`test/examples.test.ts` 保证全部样张编译零 error。
- 肉眼验证：`pnpm --filter @univer/svg-facade-playground dev` 打开 playground 逐张看渲染。
- 借自外部仓库的样张（如 ppt-master）**不要**复制进来，规矩见 `../docs/WORKFLOW.md`。
