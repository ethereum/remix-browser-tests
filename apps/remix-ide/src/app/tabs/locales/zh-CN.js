export default {
  'panel.author': '作者',
  'panel.maintainedBy': '维护者',
  'panel.documentation': '文档',
  'panel.description': '描述',

  'settings.displayName': '设置',
  'settings.reset': '恢复默认设置',
  'settings.general': '常规设置',
  'settings.generateContractMetadataText': '生成合约元数据. 在contract文件夹中生成JSON文件. 允许指定合约依赖的库地址. 如果未指定任何内容，Remix将自动部署库.',
  'settings.ethereunVMText': '加载时始终使用以太坊虚拟机',
  'settings.wordWrapText': '文本换行',
  'settings.enablePersonalModeText': '为web3提供器启用私有模式. 通过Web3发送的交易将使用web3.personal API.\n',
  'settings.warnText': '在启用之前请确认访问端结点已经开放. \n此模式允许在Remix界面中提供密码而无需解锁账号. 虽然这很方便，但你应当完全信任所连接的后端节点 (Geth, Parity, ...). Remix不会持久化保存任何密码.'.split('\n').map(s => s.trim()).join(' '),
  'settings.githubTitle': 'Github 认证信息',
  'settings.githubText': '管理用于发布到 Gist 以及读取 Github 内容的 GitHub 认证信息.',
  'settings.githubText2': '前往 github (参见下方链接) 创建一个新的token，然后保存到Remix中. 确保这个token只有 \'create gist\' 权限.',
  'settings.etherscanTokenTitle': 'EtherScan 访问 Token',
  'settings.etherscanAccessTokenText': '管理用于与Etherscan交互的api密钥.',
  'settings.etherscanAccessTokenText2': '前往 Etherscan api 密钥页面 (参见下方链接)，创建一个新的api密钥并保存到Remix中.',
  'settings.save': '保存',
  'settings.remove': '删除',
  'settings.themes': '主题',
  'settings.locales': '语言',
  'settings.swarm': 'Swarm 设置',
  'settings.ipfs': 'IPFS 设置',

  'filePanel.displayName': '文件浏览器',
  'filePanel.workspace': '工作空间',
  'filePanel.create': '新建',
  'filePanel.workspace.create': '新建工作空间',
  'filePanel.workspace.rename': '重命名当前工作空间',
  'filePanel.workspace.delete': '删除当前工作空间',
  'filePanel.workspace.deleteConfirm': '确定要删除当前工作空间?',
  'filePanel.workspace.name': '工作空间名称',
  'filePanel.workspace.chooseTemplate': '选择一个工作空间模板',
  'filePanel.workspace.download': '下载工作空间',
  'filePanel.workspace.restore': '恢复工作空间',
  'filePanel.workspace.clone': '克隆 Git 仓库',
  'filePanel.workspace.enterGitUrl': '输入 Git 仓库地址',
  'filePanel.newFile': '新建文件',
  'filePanel.newFolder': '新建文件夹',
  'filePanel.rename': '重命名',
  'filePanel.delete': '删除',
  'filePanel.deleteAll': '删除所有',
  'filePanel.run': '运行',
  'filePanel.pushChangesToGist': '将修改推送到gist',
  'filePanel.publishFolderToGist': '将当前目录发布到gist',
  'filePanel.publishFileToGist': '将当前文件发布到gist',
  'filePanel.copy': '复制',
  'filePanel.paste': '黏贴',
  'filePanel.compile': '编译',
  'filePanel.compileForNahmii': 'Nahmii编译',
  'filePanel.createNewFile': '新建文件',
  'filePanel.createNewFolder': '新建文件夹',
  'filePanel.publishToGist': '将当前工作空间下所有文件发布到github gist',
  'filePanel.uploadFile': '加载本地文件到当前工作空间',
  'filePanel.updateGist': '更新当前 [gist] 浏览',

  'home.scamAlert': '诈骗警告: 当心在线视频推广“流动性领先者机器人”.',
  'home.learnMore': '了解更多',
  'home.featuredPlugins': '精选插件',
  'home.file': '文件',
  'home.newFile': '新建文件',
  'home.openFiles': '上传本地文件',
  'home.connectToLocalhost': '连接本地主机',
  'home.loadFrom': '从以下来源导入',
  'home.resources': '资源',

  'terminal.listen': '监听所有交易',
  'terminal.search': '按交易哈希或地址搜索',
  'terminal.used': '已使用',
  'terminal.welcomeText1': '欢迎使用',
  'terminal.welcomeText2': '您的文件储存在',
  'terminal.welcomeText3': '您可使用此终端',
  'terminal.welcomeText4': '查看交易详情并启动调试',
  'terminal.welcomeText5': '执行 JavaScript 脚本',
  'terminal.welcomeText6': '直接在命令行界面输入脚本',
  'terminal.welcomeText7': '在文件浏览器中选择一个 Javascript 文件，然后在命令行界面运行 `remix.execute()` 或 `remix.exeCurrent()` ',
  'terminal.welcomeText8': '在文件浏览器中右键点击一个 JavaScript 文件，然后点击 `Run`',
  'terminal.welcomeText9': '可以访问以下库',
  'terminal.welcomeText10': '输入库名查看可用的指令',

  'debugger.displayName': '调试器',
  'debugger.debuggerConfiguration': '调试器配置',
  'debugger.stopDebugging': '停止调试',
  'debugger.startDebugging': '开始调试',
  'debugger.placeholder': '交易哈希, 应该以 0x 开头',
  'debugger.introduction': `当使用交易哈希调试时,
                  如果该合约已被验证, Remix 会试图从 Sourcify 或 Etherscan 获取源码. 在 Remix 中设置您的 Etherscan API key.
                  有关受支持的网络，请参阅`,

  'udapp.displayName': '部署 & 发交易',
  'udapp.gasLimit': 'Gas 上限',
  'udapp.account': '账户',
  'udapp.value': '以太币数量',
  'udapp.contract': '合约',
  'udapp.signAMessage': '给一个消息签名',
  'udapp.enterAMessageToSign': '输入一个需要签名的消息',
  'udapp.hash': '哈希',
  'udapp.signature': '签名',
  'udapp.signedMessage': '已签名的消息',
  'udapp.environment': '环境',
  'udapp.environmentDocs': '点击查看环境文档',
  'udapp.deploy': '部署',
  'udapp.publishTo': '发布到',
  'udapp.or': '或',
  'udapp.atAddress': '合约地址',
  'udapp.noCompiledContracts': '没有已编译的合约',
  'udapp.loadContractFromAddress': '加载此地址的合约',
  'udapp.deployedContracts': '已部署的合约',
  'udapp.deployAndRunClearInstances': '清空合约实例并重置交易记录',
  'udapp.deployAndRunNoInstanceText': '当前您没有可交互的合约实例.',
  'udapp.transactionsRecorded': '已记录交易',

  'search.displayName': '全文搜索',
  'search.replace': '替换',
  'search.replaceAll': '替换所有',
  'search.placeholder1': '搜索 ( 回车搜索 )',
  'search.placeholder2': '包含 ie *.sol ( 回车包含 )',
  'search.placeholder3': '排除 ie .git/**/* ( 回车排除 )',
  'search.matchCase': '大小写匹配',
  'search.matchWholeWord': '全字匹配',
  'search.useRegularExpression': '使用正则表达式',
  'search.replaceWithoutConfirmation': '替换无需确认',
  'search.filesToInclude': '文件包含',
  'search.filesToExclude': '文件排除',

  'solidity.displayName': 'Solidity 编译器',
  'solidity.compiler': '编译器',
  'solidity.addACustomCompiler': '添加一个自定义编译器',
  'solidity.addACustomCompilerWithURL': '通过URL添加一个自定义编译器',
  'solidity.includeNightlyBuilds': '包含每日构造版本',
  'solidity.autoCompile': '自动编译',
  'solidity.hideWarnings': '隐藏警告',
  'solidity.enableHardhat': '启用 Hardhat 编译',
  'solidity.learnHardhat': '学习怎么使用 Hardhat 编译',
  'solidity.enableTruffle': '启用 Truffle 编译',
  'solidity.learnTruffle': '学习怎么使用 Truffle 编译',
  'solidity.advancedConfigurations': '高级配置',
  'solidity.compilerConfiguration': '编译器配置',
  'solidity.compilationDetails': '编译详情',
  'solidity.language': '语言',
  'solidity.evmVersion': 'EVM 版本',
  'solidity.enableOptimization': '启用优化',
  'solidity.useConfigurationFile': '使用配置文件',
  'solidity.change': '修改',
  'solidity.compile': '编译',
  'solidity.noFileSelected': '未选中文件',
  'solidity.compileAndRunScript': '编译且执行脚本',
  'solidity.publishOn': '发布到',
  'solidity.Assembly': '合约的汇编操作码，包含对应的solidity源程序',
  'solidity.Opcodes': '合约的汇编操作码',
  'solidity.name': '已编译合约的名称',
  'solidity.metadata': '包含编译相关的全部信息',
  'solidity.bytecode': '合约创建时执行的字节码',
  'solidity.abi': 'ABI: 全部合约函数的描述 (输入/输出 参数, 作用域, ...)',
  'solidity.web3Deploy': '拷贝/粘贴这部分代码到任何 JavaScript/Web3 控制台都可以部署此合约',
  'solidity.metadataHash': '元数据的哈希值',
  'solidity.functionHashes': '合约定义的函数清单，包含对应的哈希',
  'solidity.gasEstimates': '每个函数调用的Gas估算值',
  'solidity.Runtime Bytecode': '用于保存状态并在合约调用期执行的字节码',
  'solidity.swarmLocation': '可以找到所有元数据信息的Swarm url (首先需要发布合约) ',

  'pluginManager.displayName': '插件管理',
  'pluginManager.activate': '激活',
  'pluginManager.deactivate': '停用',
  'pluginManager.activeModules': '激活的模块',
  'pluginManager.inactiveModules': '停用的模块',
  'pluginManager.connectLocal': '连接本地插件',
  'pluginManager.localForm.title': '本地插件',
  'pluginManager.localForm.pluginName': '插件名称',
  'pluginManager.localForm.shouldBeCamelCase': '应当采用驼峰命名法',
  'pluginManager.localForm.displayName': '展示名称',
  'pluginManager.localForm.nameInTheHeader': '标题中展示的名称',
  'pluginManager.localForm.required': '必填',
  'pluginManager.localForm.commaSeparatedMethod': '英文逗号分隔方法名称',
  'pluginManager.localForm.commaSeparatedPlugin': '英文逗号分隔插件名称',
  'pluginManager.localForm.pluginsItCanActivate': '能激活该插件的插件',
  'pluginManager.localForm.typeOfConnection': '连接类型',
  'pluginManager.localForm.locationInRemix': '在Remix中的位置',
  'pluginManager.localForm.sidePanel': '侧面板',
  'pluginManager.localForm.mainPanel': '主面板',
  'pluginManager.localForm.none': '无',
}
