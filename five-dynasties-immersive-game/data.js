(function (global) {
  const data = {
    stats: [
      { key: 'reputation', label: '声望', color: '#c89a3b' },
      { key: 'silver', label: '银两', color: '#bfa55a' },
      { key: 'military', label: '军势', color: '#7b2f27' },
      { key: 'public', label: '民心', color: '#3f6e59' },
      { key: 'strategy', label: '谋略', color: '#3f4f7a' },
      { key: 'prestige', label: '威望', color: '#a56532' },
      { key: 'loyalty', label: '忠诚', color: '#5d4b63' },
      { key: 'power', label: '势力', color: '#6d4b2b' }
    ],
    roles: [
      {
        id: 'li-cunxu',
        name: '李存勖',
        title: '晋王·沙陀铁骑统帅',
        route: 'military',
        desc: '骁勇善骑，信奉以战止乱。',
        stats: { reputation: 62, silver: 40, military: 88, public: 50, strategy: 70, prestige: 75, loyalty: 60, power: 68 }
      },
      {
        id: 'shi-jingtang',
        name: '石敬瑭',
        title: '河东节度使',
        route: 'military',
        desc: '隐忍而狠，善以外援破局。',
        stats: { reputation: 55, silver: 45, military: 82, public: 48, strategy: 78, prestige: 65, loyalty: 52, power: 62 }
      },
      {
        id: 'liu-zhiyuan',
        name: '刘知远',
        title: '并州留守',
        route: 'military',
        desc: '守土安民，厚待军士。',
        stats: { reputation: 50, silver: 38, military: 80, public: 55, strategy: 65, prestige: 60, loyalty: 70, power: 58 }
      },
      {
        id: 'guo-wei',
        name: '郭威',
        title: '禁军统领',
        route: 'military',
        desc: '整军严纪律，重视士卒生死。',
        stats: { reputation: 58, silver: 42, military: 84, public: 60, strategy: 72, prestige: 68, loyalty: 66, power: 60 }
      },
      {
        id: 'zhao-kuangyin',
        name: '赵匡胤',
        title: '宿卫都点检',
        route: 'military',
        desc: '胸怀远略，善抚军心。',
        stats: { reputation: 60, silver: 40, military: 86, public: 58, strategy: 74, prestige: 70, loyalty: 62, power: 64 }
      },
      {
        id: 'zhu-wen',
        name: '朱温',
        title: '后梁开国皇帝',
        route: 'court',
        desc: '以雷霆定乱世，朝堂皆其影。',
        stats: { reputation: 40, silver: 70, military: 65, public: 30, strategy: 78, prestige: 62, loyalty: 55, power: 85 }
      },
      {
        id: 'feng-dao',
        name: '冯道',
        title: '朝堂重臣',
        route: 'court',
        desc: '善度时势，言辞如水。',
        stats: { reputation: 70, silver: 55, military: 25, public: 65, strategy: 82, prestige: 75, loyalty: 72, power: 45 }
      },
      {
        id: 'li-siyuan',
        name: '李嗣源',
        title: '明宗',
        route: 'court',
        desc: '军政兼资，知人善任。',
        stats: { reputation: 65, silver: 50, military: 70, public: 60, strategy: 68, prestige: 72, loyalty: 70, power: 60 }
      },
      {
        id: 'empress-fu',
        name: '符太后',
        title: '内廷主事',
        route: 'court',
        desc: '帘后听政，稳住宫中风向。',
        stats: { reputation: 55, silver: 60, military: 30, public: 45, strategy: 75, prestige: 68, loyalty: 80, power: 58 }
      },
      {
        id: 'shen-wan',
        name: '沈婉',
        title: '掌印女官',
        route: 'court',
        desc: '一纸一印，牵动百官命脉。',
        stats: { reputation: 48, silver: 65, military: 20, public: 40, strategy: 80, prestige: 55, loyalty: 62, power: 60 }
      },
      {
        id: 'li-bian',
        name: '李昪',
        title: '江南藩镇主',
        route: 'fiscal',
        desc: '治财有道，重文兴市。',
        stats: { reputation: 62, silver: 78, military: 45, public: 60, strategy: 75, prestige: 70, loyalty: 68, power: 65 }
      },
      {
        id: 'qian-hongchu',
        name: '钱弘俶',
        title: '吴越国主',
        route: 'fiscal',
        desc: '海贸富庶，善以财稳军。',
        stats: { reputation: 58, silver: 80, military: 50, public: 62, strategy: 68, prestige: 66, loyalty: 70, power: 60 }
      },
      {
        id: 'gao-conghui',
        name: '高从诲',
        title: '荆南节度使',
        route: 'fiscal',
        desc: '夹缝求存，擅以财易势。',
        stats: { reputation: 50, silver: 72, military: 48, public: 55, strategy: 65, prestige: 58, loyalty: 60, power: 55 }
      },
      {
        id: 'zhou-xing',
        name: '周行',
        title: '江淮巨贾',
        route: 'fiscal',
        desc: '盐铁起家，商道通四方。',
        stats: { reputation: 45, silver: 85, military: 20, public: 50, strategy: 70, prestige: 40, loyalty: 55, power: 52 }
      },
      {
        id: 'han-xizai',
        name: '韩熙载',
        title: '南唐名士',
        route: 'scholar',
        desc: '直言敢谏，重史重义。',
        stats: { reputation: 68, silver: 40, military: 20, public: 70, strategy: 85, prestige: 76, loyalty: 60, power: 40 }
      },
      {
        id: 'feng-yanji',
        name: '冯延巳',
        title: '词臣',
        route: 'scholar',
        desc: '辞章为刃，善以文动人。',
        stats: { reputation: 60, silver: 45, military: 18, public: 65, strategy: 82, prestige: 70, loyalty: 58, power: 42 }
      },
      {
        id: 'ouyang-jiong',
        name: '欧阳炯',
        title: '后蜀学士',
        route: 'scholar',
        desc: '文胆担当，胸怀山河。',
        stats: { reputation: 62, silver: 38, military: 15, public: 62, strategy: 78, prestige: 68, loyalty: 55, power: 38 }
      },
      {
        id: 'qinghui',
        name: '清慧法师',
        title: '寺院主持',
        route: 'scholar',
        desc: '行走诸国，度人亦度势。',
        stats: { reputation: 55, silver: 30, military: 10, public: 75, strategy: 70, prestige: 72, loyalty: 65, power: 30 }
      }
    ],
    chapters: [
      {
        id: 'c1',
        title: '风起中原',
        nodes: [
          {
            id: 'c1.mil',
            route: 'military',
            title: '霜鼓初鸣',
            location: '河东军营',
            speaker: '行军主簿',
            quote: '乱世先立兵威，再谈道理。',
            text: [
              '新朝刚立，四方群雄观望。军帐之内，诸将争论该先击梁军，还是先稳河东人心。',
              '你握着冷刃，知道第一步会决定军心，也会决定你的名声。'
            ],
            options: [
              {
                text: '整军北上，先立威名',
                hint: '军势+6 · 威望+4 · 民心-2',
                effects: { military: 6, prestige: 4, public: -2, silver: -3 },
                flags: { set: ['stance_hard', 'build_army'], clear: ['stance_soft'] }
              },
              {
                text: '先稳军心，缓图大势',
                hint: '谋略+5 · 声望+4 · 民心+2',
                effects: { strategy: 5, reputation: 4, public: 2 },
                flags: { set: ['stance_soft'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c1.court',
            route: 'court',
            title: '新朝旧影',
            location: '汴梁宫城',
            speaker: '内廷侍从',
            quote: '宫门一合，旧臣便成影子。',
            text: [
              '朱氏立国，旧党残存。朝堂上你听见两派争辩，一派要血洗异己，一派要收拢人心。',
              '你知晓这不是仁义之争，而是权力的分配。'
            ],
            options: [
              {
                text: '辅皇整肃旧臣',
                hint: '势力+6 · 威望+3 · 忠诚-3',
                effects: { power: 6, prestige: 3, loyalty: -3, public: -2 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '主张安抚余党',
                hint: '声望+5 · 民心+3 · 谋略+2',
                effects: { reputation: 5, public: 3, strategy: 2 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c1.fiscal',
            route: 'fiscal',
            title: '盐铁之钥',
            location: '淮南漕署',
            speaker: '库吏',
            quote: '钱谷一动，江河先震。',
            text: [
              '战乱掏空国库，江淮盐铁成各路豪强争夺之地。',
              '你要决定，是以税填军，还是以市养民。'
            ],
            options: [
              {
                text: '加税以充军费',
                hint: '银两+7 · 民心-4 · 声望-2',
                effects: { silver: 7, public: -4, reputation: -2 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '开河贸以活市',
                hint: '银两+4 · 民心+3 · 声望+2',
                effects: { silver: 4, public: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c1.scholar',
            route: 'scholar',
            title: '墨灯未熄',
            location: '江南书院',
            speaker: '师友',
            quote: '世道翻覆，文脉不可断。',
            text: [
              '乡里兵乱四起，书院门前却仍有求学子。',
              '你可以投身军旅，也可以守住读书人的火种。'
            ],
            options: [
              {
                text: '投笔从戎，扶危济世',
                hint: '军势+3 · 声望+4 · 忠诚+2',
                effects: { military: 3, reputation: 4, loyalty: 2 },
                flags: { set: ['stance_hard', 'join_militia'], clear: ['stance_soft'] }
              },
              {
                text: '兴学立社，守文脉',
                hint: '谋略+4 · 民心+4 · 威望+3',
                effects: { strategy: 4, public: 4, prestige: 3 },
                flags: { set: ['stance_soft', 'found_school'], clear: ['stance_hard'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c2',
        title: '河洛棋局',
        nodes: [
          {
            id: 'c2.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '铁骑夺路',
            location: '河洛前线',
            speaker: '前锋将',
            quote: '趁夜夺粮道，可断其气。',
            text: [
              '你已整军出塞，梁军正围洛口。诸将请你一战破局。',
              '杀气与寒风同在，你只需一令。'
            ],
            options: [
              {
                text: '夜袭粮道，夺其后援',
                hint: '军势+6 · 威望+3 · 银两+2',
                effects: { military: 6, prestige: 3, silver: 2, public: -1 },
                flags: { set: ['stance_hard', 'ally_shatuo'], clear: ['stance_soft'] }
              },
              {
                text: '设伏待机，联络诸镇',
                hint: '谋略+5 · 声望+3 · 民心+1',
                effects: { strategy: 5, reputation: 3, public: 1 },
                flags: { set: ['stance_soft', 'build_coalition'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c2.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '缓兵以谋',
            location: '河东议帐',
            speaker: '谋主',
            quote: '兵不在猛，而在势。',
            text: [
              '你按兵不动，梁军却步步逼近。将领私下抱怨，盟友催你决断。',
              '你要选择在暗处结盟，还是继续隐忍。'
            ],
            options: [
              {
                text: '结盟沙陀旧部，蓄势起兵',
                hint: '军势+3 · 声望+3 · 谋略+2',
                effects: { military: 3, reputation: 3, strategy: 2 },
                flags: { set: ['stance_hard', 'ally_shatuo'], clear: ['stance_soft'] }
              },
              {
                text: '继续隐忍，稳住河东',
                hint: '民心+3 · 忠诚+3 · 谋略+2',
                effects: { public: 3, loyalty: 3, strategy: 2 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c2.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '军费令下',
            location: '汴梁朝堂',
            speaker: '尚书',
            quote: '用兵之际，先看钱谷。',
            text: [
              '你支持强硬路线，朝堂上令牌飞出，诸镇被迫纳粮。',
              '权力在你指间聚拢，却也招来暗恨。'
            ],
            options: [
              {
                text: '征发三镇，压住异心',
                hint: '势力+5 · 银两+4 · 民心-3',
                effects: { power: 5, silver: 4, public: -3, loyalty: -2 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '以赏募兵，稳住军心',
                hint: '忠诚+4 · 声望+2 · 银两-3',
                effects: { loyalty: 4, reputation: 2, silver: -3 },
                flags: { set: ['stance_soft', 'loyalty_oath'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c2.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '帘后议和',
            location: '内廷密议',
            speaker: '宫中密使',
            quote: '缓一时，或可换一世。',
            text: [
              '你主张安抚，朝堂上却风声四起。有人建议暗通沙陀以挟外势。',
              '你要选择借力还是固守朝廷。'
            ],
            options: [
              {
                text: '暗许沙陀，换取喘息',
                hint: '谋略+4 · 声望+2 · 势力+1',
                effects: { strategy: 4, reputation: 2, power: 1 },
                flags: { set: ['stance_hard', 'ally_shatuo'], clear: ['stance_soft'] }
              },
              {
                text: '维持梁廷秩序',
                hint: '忠诚+4 · 民心+1',
                effects: { loyalty: 4, public: 1 },
                flags: { set: ['stance_soft', 'loyalty_oath'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c2.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '军粮压境',
            location: '江淮仓廪',
            speaker: '盐铁判官',
            quote: '有粮者为王。',
            text: [
              '前线军书不断，诸镇索粮。你若不调配，军心动摇。',
              '但压榨过度，商户会转身投敌。'
            ],
            options: [
              {
                text: '强征盐税，充作军资',
                hint: '银两+6 · 民心-4 · 威望+2',
                effects: { silver: 6, public: -4, prestige: 2 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '开市换粮，稳住人心',
                hint: '银两+3 · 民心+3 · 声望+2',
                effects: { silver: 3, public: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c2.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '账册如山',
            location: '漕运司',
            speaker: '老吏',
            quote: '银两是水，民心是岸。',
            text: [
              '你主张减负，然而军需又至。诸商催你给出新路。',
              '是借商资武，还是稳市救民。'
            ],
            options: [
              {
                text: '借商资武，换军镇支持',
                hint: '银两+4 · 军势+2 · 势力+1',
                effects: { silver: 4, military: 2, power: 1 },
                flags: { set: ['stance_hard', 'build_army'], clear: ['stance_soft'] }
              },
              {
                text: '减徭稳市，先固民心',
                hint: '民心+4 · 声望+2 · 银两-2',
                effects: { public: 4, reputation: 2, silver: -2 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c2.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '檄文上城',
            location: '城楼',
            speaker: '书院同门',
            quote: '文能动众，亦能伤人。',
            text: [
              '你已投身于军，城中人心惶惶。有人请你写檄文，激起战意。',
              '你明白言辞一出，便难回头。'
            ],
            options: [
              {
                text: '挥笔檄梁，鼓动义气',
                hint: '声望+5 · 威望+2 · 民心-1',
                effects: { reputation: 5, prestige: 2, public: -1 },
                flags: { set: ['stance_hard', 'join_militia'], clear: ['stance_soft'] }
              },
              {
                text: '劝和保民，留条生路',
                hint: '民心+4 · 谋略+3',
                effects: { public: 4, strategy: 3 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c2.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '山寺避乱',
            location: '江南古寺',
            speaker: '老僧',
            quote: '乱世先护人，再护书。',
            text: [
              '你暂避锋芒，寺中却收容了大量流民。世道要你出声。',
              '是继续守静，还是为义军献策。'
            ],
            options: [
              {
                text: '出山讲义，安民心',
                hint: '民心+4 · 声望+2 · 威望+2',
                effects: { public: 4, reputation: 2, prestige: 2 },
                flags: { set: ['stance_soft', 'found_school'], clear: ['stance_hard'] }
              },
              {
                text: '暗献策书，助义军',
                hint: '谋略+4 · 军势+2',
                effects: { strategy: 4, military: 2 },
                flags: { set: ['stance_hard', 'join_militia'], clear: ['stance_soft'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c3',
        title: '龙旗易帜',
        nodes: [
          {
            id: 'c3.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '横刀破城',
            location: '洛口渡',
            speaker: '先锋',
            quote: '城门只认强者。',
            text: [
              '你主张强攻，梁军阵线被你撕开。新旗帜正在升起。',
              '但城中百姓的目光如刃，等待你的下一步。'
            ],
            options: [
              {
                text: '攻下城门，肃清余党',
                hint: '军势+5 · 势力+3 · 民心-2',
                effects: { military: 5, power: 3, public: -2 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '约束军纪，稳住洛城',
                hint: '民心+3 · 声望+3 · 忠诚+2',
                effects: { public: 3, reputation: 3, loyalty: 2 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c3.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '城门轻启',
            location: '洛阳外',
            speaker: '守城将',
            quote: '开门易，收心难。',
            text: [
              '你选择软着陆，派人劝降守军。洛城开门，旧臣却暗中观望。',
              '你要抓住时机立威，还是继续安抚。'
            ],
            options: [
              {
                text: '择要处分，立新法度',
                hint: '威望+4 · 势力+2 · 民心-1',
                effects: { prestige: 4, power: 2, public: -1 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '广开城仓，抚恤百姓',
                hint: '民心+4 · 声望+3 · 银两-3',
                effects: { public: 4, reputation: 3, silver: -3 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c3.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '新君旧臣',
            location: '金銮殿',
            speaker: '掌印',
            quote: '换了天，不换人，就换不了天下。',
            text: [
              '新王入洛，你建议尽快换血朝堂。旧臣在殿下瑟缩。',
              '你一声令下，便可定下新秩序。'
            ],
            options: [
              {
                text: '大举清洗，削其根基',
                hint: '势力+6 · 威望+2 · 忠诚-2',
                effects: { power: 6, prestige: 2, loyalty: -2 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '安置旧臣，换取效忠',
                hint: '忠诚+4 · 声望+3',
                effects: { loyalty: 4, reputation: 3 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c3.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '帷幕新盟',
            location: '内廷偏殿',
            speaker: '侍中',
            quote: '人心不稳，盟约先行。',
            text: [
              '你主张稳住朝局，旧臣愿以名望换取平安。',
              '你要借他们之名立威，还是继续宽宥。'
            ],
            options: [
              {
                text: '借其名望，压制诸镇',
                hint: '势力+4 · 威望+3 · 忠诚-1',
                effects: { power: 4, prestige: 3, loyalty: -1 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '赐爵安置，稳住人心',
                hint: '民心+3 · 声望+3',
                effects: { public: 3, reputation: 3 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c3.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '新旗入库',
            location: '洛阳府库',
            speaker: '户曹',
            quote: '先握钱袋，方能握军心。',
            text: [
              '改朝换代，库府需重整。你主张以军为先，重定税制。',
              '百姓会埋怨，但新政能稳军。'
            ],
            options: [
              {
                text: '重定税制，集中财权',
                hint: '银两+6 · 势力+3 · 民心-3',
                effects: { silver: 6, power: 3, public: -3 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '减免旧债，平复人心',
                hint: '民心+4 · 声望+2 · 银两-3',
                effects: { public: 4, reputation: 2, silver: -3 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c3.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '漕运新规',
            location: '江淮码头',
            speaker: '漕运使',
            quote: '市井顺了，天下才稳。',
            text: [
              '你主张宽政，商贾得以复业。却有人指责你贪利误军。',
              '你要加码军资，还是继续护商。'
            ],
            options: [
              {
                text: '抽商资军，维持战线',
                hint: '银两+4 · 军势+2 · 民心-1',
                effects: { silver: 4, military: 2, public: -1 },
                flags: { set: ['stance_hard', 'build_army'], clear: ['stance_soft'] }
              },
              {
                text: '放宽关税，繁荣市集',
                hint: '银两+2 · 民心+3 · 声望+2',
                effects: { silver: 2, public: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c3.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '新朝檄文',
            location: '州学',
            speaker: '学官',
            quote: '笔落三分，已定胜负。',
            text: [
              '朝代更易，檄文要一锤定音。你被推举撰写新朝立国文告。',
              '是以刀剑立威，还是以义理抚人。'
            ],
            options: [
              {
                text: '重申军功，立威四方',
                hint: '威望+4 · 军势+2 · 民心-1',
                effects: { prestige: 4, military: 2, public: -1 },
                flags: { set: ['stance_hard', 'join_militia'], clear: ['stance_soft'] }
              },
              {
                text: '宣示仁政，安抚士心',
                hint: '民心+4 · 声望+3',
                effects: { public: 4, reputation: 3 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c3.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '文脉归位',
            location: '书院讲堂',
            speaker: '同门',
            quote: '教化不在强势，在恒心。',
            text: [
              '你主张宽政，书院得以重开。但战乱仍在，军府需要士人。',
              '你要投身新政，还是继续守学。'
            ],
            options: [
              {
                text: '入幕献策，辅新政',
                hint: '谋略+4 · 声望+2 · 势力+1',
                effects: { strategy: 4, reputation: 2, power: 1 },
                flags: { set: ['stance_hard', 'coopt_elites'], clear: ['stance_soft'] }
              },
              {
                text: '留守书院，广收弟子',
                hint: '民心+3 · 威望+3',
                effects: { public: 3, prestige: 3 },
                flags: { set: ['stance_soft', 'found_school'], clear: ['stance_hard'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c4',
        title: '金殿风雷',
        nodes: [
          {
            id: 'c4.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '禁军肃令',
            location: '皇城门下',
            speaker: '都指挥使',
            quote: '军法如山，殿前无情。',
            text: [
              '宫廷争斗升级，禁军被迫站队。你被要求迅速镇压异动。',
              '选择强硬，将稳住宫城，也会留下血债。'
            ],
            options: [
              {
                text: '封锁宫门，清剿叛党',
                hint: '军势+4 · 势力+3 · 声望-2',
                effects: { military: 4, power: 3, reputation: -2 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '只拿首恶，留出退路',
                hint: '谋略+3 · 忠诚+2 · 民心+1',
                effects: { strategy: 3, loyalty: 2, public: 1 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c4.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '夜巡宫阙',
            location: '皇城夜廊',
            speaker: '副将',
            quote: '守城也要守人心。',
            text: [
              '你倾向克制，却见诸派互相试探。宫城如临深渊。',
              '你是要展露锋芒，还是继续维持平衡。'
            ],
            options: [
              {
                text: '亮出兵符，震慑诸党',
                hint: '威望+4 · 军势+2 · 民心-1',
                effects: { prestige: 4, military: 2, public: -1 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '护送太后，稳住内廷',
                hint: '忠诚+3 · 声望+2 · 民心+1',
                effects: { loyalty: 3, reputation: 2, public: 1 },
                flags: { set: ['stance_soft', 'loyalty_oath'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c4.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '金殿雷霆',
            location: '正殿',
            speaker: '中书令',
            quote: '一纸诏书，可定百官生死。',
            text: [
              '你主张快刀斩乱麻，诏书一出，朝堂震动。',
              '血色在石阶蔓延，你的权势随之拔高。'
            ],
            options: [
              {
                text: '趁势推新法，夺回军权',
                hint: '势力+6 · 威望+2 · 忠诚-2',
                effects: { power: 6, prestige: 2, loyalty: -2 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '留存旧臣，换忠心',
                hint: '忠诚+4 · 声望+2',
                effects: { loyalty: 4, reputation: 2 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c4.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '帘后安抚',
            location: '内廷书房',
            speaker: '女官',
            quote: '硬刀切乱麻，软语收人心。',
            text: [
              '你主张安抚，却遭质疑软弱。内廷求你给出折中之策。',
              '你可借威势压住异议，也可继续以德服人。'
            ],
            options: [
              {
                text: '设立监司，收紧权柄',
                hint: '势力+4 · 谋略+2 · 民心-1',
                effects: { power: 4, strategy: 2, public: -1 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '赐宴安抚，凝聚朝心',
                hint: '民心+3 · 忠诚+3',
                effects: { public: 3, loyalty: 3 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c4.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '国库风声',
            location: '户部',
            speaker: '主簿',
            quote: '朝堂震荡，钱袋先紧。',
            text: [
              '朝堂动乱使税赋滞后，你决定以铁腕稳住库府。',
              '强行征敛，能保军费，却伤商信。'
            ],
            options: [
              {
                text: '强征军费，先稳禁军',
                hint: '银两+6 · 军势+2 · 民心-3',
                effects: { silver: 6, military: 2, public: -3 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '借贷豪商，暂度危机',
                hint: '银两+3 · 声望+2 · 忠诚-1',
                effects: { silver: 3, reputation: 2, loyalty: -1 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c4.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '市井未静',
            location: '洛阳坊市',
            speaker: '商会头目',
            quote: '税不稳，市先散。',
            text: [
              '你主张稳市，商贾愿出钱助政，但要求减税。',
              '你若答应，军费会紧；若拒绝，商道会断。'
            ],
            options: [
              {
                text: '答应减税，保住商路',
                hint: '民心+3 · 银两-2 · 声望+2',
                effects: { public: 3, silver: -2, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              },
              {
                text: '压价征购，军需优先',
                hint: '银两+4 · 军势+2 · 民心-2',
                effects: { silver: 4, military: 2, public: -2 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              }
            ]
          },
          {
            id: 'c4.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '笔断恩仇',
            location: '文馆',
            speaker: '史官',
            quote: '史册可杀人，也可救人。',
            text: [
              '宫廷震荡，史官笔下可以定罪。你被要求写下某派罪状。',
              '你若从之，便是刀笔杀人。'
            ],
            options: [
              {
                text: '落笔定罪，稳住朝局',
                hint: '势力+3 · 威望+2 · 民心-1',
                effects: { power: 3, prestige: 2, public: -1 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '以史缓罪，护人心',
                hint: '民心+3 · 声望+2',
                effects: { public: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c4.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '清议回潮',
            location: '书院后庭',
            speaker: '同门',
            quote: '清议虽轻，却能压城。',
            text: [
              '你主张稳人心，书院却传来清议，要你表态。',
              '你可借清议制衡权贵，也可远离是非。'
            ],
            options: [
              {
                text: '公开进言，约束权贵',
                hint: '声望+4 · 威望+2 · 势力-1',
                effects: { reputation: 4, prestige: 2, power: -1 },
                flags: { set: ['stance_hard', 'protect_scholars'], clear: ['stance_soft'] }
              },
              {
                text: '暂避锋芒，护住书院',
                hint: '民心+2 · 忠诚+2',
                effects: { public: 2, loyalty: 2 },
                flags: { set: ['stance_soft', 'found_school'], clear: ['stance_hard'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c5',
        title: '燕云风雪',
        nodes: [
          {
            id: 'c5.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '雪原鏖战',
            location: '幽州北野',
            speaker: '骑将',
            quote: '燕云不许轻让。',
            text: [
              '契丹铁骑南下，边塞烟尘再起。你主张硬碰硬。',
              '这一战若胜，威望可立；若败，河山尽失。'
            ],
            options: [
              {
                text: '迎击契丹，死守要塞',
                hint: '军势+5 · 威望+3 · 银两-2',
                effects: { military: 5, prestige: 3, silver: -2 },
                flags: { set: ['stance_hard', 'defend_yanyun'], clear: ['stance_soft', 'cede_yanyun'] }
              },
              {
                text: '退守内线，保全实力',
                hint: '谋略+4 · 民心+2 · 威望-1',
                effects: { strategy: 4, public: 2, prestige: -1 },
                flags: { set: ['stance_soft', 'cede_yanyun'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c5.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '和议寒风',
            location: '榆关营地',
            speaker: '参军',
            quote: '和议未必是屈，但代价常是地。',
            text: [
              '你主张保全实力，契丹使者递来和议书。',
              '若应允，边防或可喘息，但燕云难保。'
            ],
            options: [
              {
                text: '同意和议，以地换时',
                hint: '谋略+4 · 银两+2 · 威望-2',
                effects: { strategy: 4, silver: 2, prestige: -2 },
                flags: { set: ['stance_soft', 'cede_yanyun', 'khitan_pact'], clear: ['stance_hard'] }
              },
              {
                text: '拒绝和议，暗备反击',
                hint: '军势+3 · 威望+2 · 银两-2',
                effects: { military: 3, prestige: 2, silver: -2 },
                flags: { set: ['stance_hard', 'defend_yanyun'], clear: ['stance_soft'] }
              }
            ]
          },
          {
            id: 'c5.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '朝议北虏',
            location: '大朝会',
            speaker: '宰辅',
            quote: '割地易，收回难。',
            text: [
              '朝廷分裂，有人主张割地换安，你坚持强硬。',
              '你要为战准备更多资源。'
            ],
            options: [
              {
                text: '严令诸镇备战',
                hint: '势力+4 · 军势+3 · 民心-2',
                effects: { power: 4, military: 3, public: -2 },
                flags: { set: ['stance_hard', 'defend_yanyun'], clear: ['stance_soft'] }
              },
              {
                text: '秘密筹和，留后路',
                hint: '谋略+4 · 声望+1 · 威望-1',
                effects: { strategy: 4, reputation: 1, prestige: -1 },
                flags: { set: ['stance_soft', 'khitan_pact'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c5.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '割与不割',
            location: '内廷密议',
            speaker: '内侍',
            quote: '割地只为喘息。',
            text: [
              '你倾向和议，群臣却纷纷上表反对。',
              '你可以坚持割地，也可以回头强硬。'
            ],
            options: [
              {
                text: '同意割地，换短暂和平',
                hint: '银两+3 · 谋略+3 · 威望-2',
                effects: { silver: 3, strategy: 3, prestige: -2 },
                flags: { set: ['stance_soft', 'cede_yanyun', 'khitan_pact'], clear: ['stance_hard'] }
              },
              {
                text: '转为强硬，拒绝和议',
                hint: '威望+3 · 军势+2 · 民心-1',
                effects: { prestige: 3, military: 2, public: -1 },
                flags: { set: ['stance_hard', 'defend_yanyun'], clear: ['stance_soft'] }
              }
            ]
          },
          {
            id: 'c5.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '北地军费',
            location: '户部',
            speaker: '度支使',
            quote: '守燕云，银如流水。',
            text: [
              '边防吃紧，你主张以财力支撑军镇。',
              '加税会让市井哗然。'
            ],
            options: [
              {
                text: '增税征粮，先稳军心',
                hint: '银两+6 · 军势+2 · 民心-3',
                effects: { silver: 6, military: 2, public: -3 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '以债筹饷，稳住市面',
                hint: '银两+3 · 声望+2 · 忠诚-1',
                effects: { silver: 3, reputation: 2, loyalty: -1 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c5.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '贡与战',
            location: '市舶司',
            speaker: '商人',
            quote: '贡与战，皆要银。',
            text: [
              '你倾向和议，贡礼压在市井。商贾请求减轻负担。',
              '你要继续贡，还是转向硬拼。'
            ],
            options: [
              {
                text: '承诺贡赋，换取通商',
                hint: '银两+3 · 民心+2 · 威望-1',
                effects: { silver: 3, public: 2, prestige: -1 },
                flags: { set: ['stance_soft', 'khitan_pact'], clear: ['stance_hard'] }
              },
              {
                text: '削贡备战，稳住尊严',
                hint: '军势+3 · 威望+2 · 银两-2',
                effects: { military: 3, prestige: 2, silver: -2 },
                flags: { set: ['stance_hard', 'defend_yanyun'], clear: ['stance_soft'] }
              }
            ]
          },
          {
            id: 'c5.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '边关诗檄',
            location: '关城',
            speaker: '随军文士',
            quote: '诗可写山河，也可写骨血。',
            text: [
              '你随军北上，士气低迷。你要用笔鼓动人心。',
              '你能以忠烈激将，也能以安民为主。'
            ],
            options: [
              {
                text: '写血战檄，激励死守',
                hint: '威望+3 · 军势+2 · 民心-1',
                effects: { prestige: 3, military: 2, public: -1 },
                flags: { set: ['stance_hard', 'defend_yanyun'], clear: ['stance_soft'] }
              },
              {
                text: '写安民书，稳住后方',
                hint: '民心+4 · 声望+2',
                effects: { public: 4, reputation: 2 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c5.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '议和之声',
            location: '书院',
            speaker: '学友',
            quote: '和议非屈，屈在无备。',
            text: [
              '你主张缓和，书院里争论不休。有人要你上书抗议割地。',
              '你可坚持和议，也可顺势转硬。'
            ],
            options: [
              {
                text: '上书缓和，守住民心',
                hint: '民心+3 · 谋略+3',
                effects: { public: 3, strategy: 3 },
                flags: { set: ['stance_soft', 'khitan_pact'], clear: ['stance_hard'] }
              },
              {
                text: '上书抗敌，唤醒士气',
                hint: '声望+4 · 威望+2',
                effects: { reputation: 4, prestige: 2 },
                flags: { set: ['stance_hard', 'defend_yanyun'], clear: ['stance_soft'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c6',
        title: '河东再燃',
        nodes: [
          {
            id: 'c6.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '起兵河东',
            location: '并州',
            speaker: '将军',
            quote: '乱世不等人。',
            text: [
              '旧朝气数已尽，河东军心躁动。你主张立刻起兵，夺取先机。',
              '你的刀锋指向中原，天下开始传你的名号。'
            ],
            options: [
              {
                text: '迅速南下，夺取关中',
                hint: '军势+5 · 势力+3 · 民心-2',
                effects: { military: 5, power: 3, public: -2 },
                flags: { set: ['stance_hard', 'build_army'], clear: ['stance_soft'] }
              },
              {
                text: '先稳并州，收拢流民',
                hint: '民心+4 · 声望+3',
                effects: { public: 4, reputation: 3 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c6.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '缓图河东',
            location: '晋阳',
            speaker: '军师',
            quote: '稳住根基，才有远图。',
            text: [
              '你谨慎行事，先抚百姓。将领担心失去先机。',
              '你可以迅速起兵，或继续稳守。'
            ],
            options: [
              {
                text: '趁乱起兵，争夺天命',
                hint: '军势+4 · 威望+3 · 民心-1',
                effects: { military: 4, prestige: 3, public: -1 },
                flags: { set: ['stance_hard', 'build_army'], clear: ['stance_soft'] }
              },
              {
                text: '修治城防，安置流民',
                hint: '民心+4 · 忠诚+2 · 银两-2',
                effects: { public: 4, loyalty: 2, silver: -2 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c6.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '新君将立',
            location: '朝堂',
            speaker: '礼部',
            quote: '立谁为君，便定谁为敌。',
            text: [
              '旧朝失势，群臣议立新君。你主张强势拥立。',
              '此举可稳朝局，却会引发反弹。'
            ],
            options: [
              {
                text: '拥立强主，压服诸镇',
                hint: '势力+5 · 威望+3 · 忠诚-2',
                effects: { power: 5, prestige: 3, loyalty: -2 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '缓议君位，先安百官',
                hint: '声望+3 · 忠诚+3',
                effects: { reputation: 3, loyalty: 3 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c6.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '和议未定',
            location: '内廷',
            speaker: '内侍',
            quote: '人心比君位更难定。',
            text: [
              '你主张缓立新君，暂稳各方。却有人借机扩张。',
              '你可转向强势，也可继续安抚。'
            ],
            options: [
              {
                text: '立新君以定众',
                hint: '威望+4 · 势力+3 · 忠诚-1',
                effects: { prestige: 4, power: 3, loyalty: -1 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '赐赏安抚，缓争夺',
                hint: '忠诚+4 · 民心+2',
                effects: { loyalty: 4, public: 2 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c6.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '战后重税',
            location: '州府账房',
            speaker: '算官',
            quote: '乱后必收，收后必乱。',
            text: [
              '新局未稳，军费却要补。你主张以重税恢复财力。',
              '百姓怨声渐起。'
            ],
            options: [
              {
                text: '增税征敛，填补军费',
                hint: '银两+6 · 军势+2 · 民心-3',
                effects: { silver: 6, military: 2, public: -3 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '缓税行赈，稳住人心',
                hint: '民心+4 · 声望+3 · 银两-2',
                effects: { public: 4, reputation: 3, silver: -2 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c6.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '赈济与税',
            location: '江淮仓廪',
            speaker: '老吏',
            quote: '乱后第一课，是让人活下去。',
            text: [
              '你主张赈济，商户却希望减税以恢复市集。',
              '你要继续宽政，还是转向重税。'
            ],
            options: [
              {
                text: '继续赈济，护民心',
                hint: '民心+4 · 声望+2 · 银两-3',
                effects: { public: 4, reputation: 2, silver: -3 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              },
              {
                text: '恢复税制，稳军需',
                hint: '银两+4 · 军势+2 · 民心-2',
                effects: { silver: 4, military: 2, public: -2 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              }
            ]
          },
          {
            id: 'c6.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '檄文再起',
            location: '军中幕府',
            speaker: '幕僚',
            quote: '乱世需要声音。',
            text: [
              '你随军行走，诸镇纷纷起兵。檄文要你定调。',
              '你可宣扬强硬，也可强调安民。'
            ],
            options: [
              {
                text: '宣扬强军，号召起兵',
                hint: '声望+4 · 军势+2 · 民心-1',
                effects: { reputation: 4, military: 2, public: -1 },
                flags: { set: ['stance_hard', 'join_militia'], clear: ['stance_soft'] }
              },
              {
                text: '写安民文，压住躁动',
                hint: '民心+4 · 谋略+2',
                effects: { public: 4, strategy: 2 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c6.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '乡里安抚',
            location: '乡学',
            speaker: '乡老',
            quote: '乱时守一乡，也可守天下。',
            text: [
              '你选择安抚乡里，流民与兵卒齐至。',
              '你可以组织义勇，或继续以教化安民。'
            ],
            options: [
              {
                text: '组义勇，护乡寨',
                hint: '军势+3 · 声望+3 · 民心-1',
                effects: { military: 3, reputation: 3, public: -1 },
                flags: { set: ['stance_hard', 'join_militia'], clear: ['stance_soft'] }
              },
              {
                text: '兴社学，守文脉',
                hint: '民心+3 · 威望+3',
                effects: { public: 3, prestige: 3 },
                flags: { set: ['stance_soft', 'found_school'], clear: ['stance_hard'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c7',
        title: '周室新政',
        nodes: [
          {
            id: 'c7.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '整军新制',
            location: '军府校场',
            speaker: '都校',
            quote: '军纪一新，战意也新。',
            text: [
              '新政推行，要求重整禁军。你主张严刑立纪。',
              '铁血之下，军心更稳，却多怨气。'
            ],
            options: [
              {
                text: '严令整军，立军纪',
                hint: '军势+5 · 威望+3 · 忠诚-2',
                effects: { military: 5, prestige: 3, loyalty: -2 },
                flags: { set: ['stance_hard', 'build_army'], clear: ['stance_soft'] }
              },
              {
                text: '奖惩并施，稳士气',
                hint: '忠诚+3 · 民心+2 · 银两-2',
                effects: { loyalty: 3, public: 2, silver: -2 },
                flags: { set: ['stance_soft', 'loyalty_oath'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c7.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '新军与旧兵',
            location: '禁军营',
            speaker: '老兵',
            quote: '新法要立，旧恩也要续。',
            text: [
              '你主张温和改革，旧兵却疑心新制削权。',
              '你可强推新法，或安抚旧部。'
            ],
            options: [
              {
                text: '强推新法，整肃旧部',
                hint: '军势+4 · 威望+3 · 忠诚-2',
                effects: { military: 4, prestige: 3, loyalty: -2 },
                flags: { set: ['stance_hard', 'build_army'], clear: ['stance_soft'] }
              },
              {
                text: '安抚旧部，缓步改革',
                hint: '忠诚+4 · 民心+2',
                effects: { loyalty: 4, public: 2 },
                flags: { set: ['stance_soft', 'loyalty_oath'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c7.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '新法入朝',
            location: '朝堂',
            speaker: '宰辅',
            quote: '新政需强手。',
            text: [
              '新政激起旧党反弹，你主张强推法令。',
              '朝堂上声浪翻涌，权力在你手中收紧。'
            ],
            options: [
              {
                text: '推行新法，压制旧党',
                hint: '势力+5 · 威望+3 · 忠诚-2',
                effects: { power: 5, prestige: 3, loyalty: -2 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '分派旧臣，稳住朝局',
                hint: '忠诚+3 · 声望+2',
                effects: { loyalty: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c7.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '新旧两难',
            location: '内廷',
            speaker: '中书舍人',
            quote: '新政不难，难在新旧并存。',
            text: [
              '你主张缓推新政，旧党却趁机掣肘。',
              '你可转向强硬，也可继续折中。'
            ],
            options: [
              {
                text: '严限旧党，推进法令',
                hint: '势力+4 · 威望+2 · 忠诚-1',
                effects: { power: 4, prestige: 2, loyalty: -1 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '设缓冲期，稳住朝局',
                hint: '忠诚+3 · 民心+2',
                effects: { loyalty: 3, public: 2 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c7.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '税改风暴',
            location: '户部',
            speaker: '度支判官',
            quote: '税改如刀，割旧肉换新骨。',
            text: [
              '新政要求重整田税，你主张强力推行。',
              '财力回升，但民怨聚集。'
            ],
            options: [
              {
                text: '强推税制，稳军需',
                hint: '银两+6 · 军势+2 · 民心-3',
                effects: { silver: 6, military: 2, public: -3 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '设缓冲期，抚民心',
                hint: '民心+3 · 声望+2 · 银两-2',
                effects: { public: 3, reputation: 2, silver: -2 },
                flags: { set: ['stance_soft', 'relief_famine'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c7.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '缓税新策',
            location: '漕运司',
            speaker: '商会头目',
            quote: '缓税不等于无税。',
            text: [
              '你主张缓推税改，商贾希望减税。',
              '你可趁势强推，也可继续宽政。'
            ],
            options: [
              {
                text: '借机重税，充实库府',
                hint: '银两+4 · 军势+2 · 民心-2',
                effects: { silver: 4, military: 2, public: -2 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '继续缓税，稳住市面',
                hint: '民心+3 · 声望+2',
                effects: { public: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c7.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '新政序章',
            location: '国子监',
            speaker: '祭酒',
            quote: '教化要有力。',
            text: [
              '你被邀请参与新政宣示，要求你写下明确纲领。',
              '你可强调法度强硬，也可突出德治温和。'
            ],
            options: [
              {
                text: '立法为先，强调纪律',
                hint: '威望+3 · 势力+2 · 民心-1',
                effects: { prestige: 3, power: 2, public: -1 },
                flags: { set: ['stance_hard', 'protect_scholars'], clear: ['stance_soft'] }
              },
              {
                text: '以德为先，安抚士心',
                hint: '民心+4 · 声望+2',
                effects: { public: 4, reputation: 2 },
                flags: { set: ['stance_soft', 'found_school'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c7.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '学政重开',
            location: '书院',
            speaker: '门生',
            quote: '旧书未废，新学未成。',
            text: [
              '你主张温和教化，学政初开。旧党担心新学削权。',
              '你可强推新学，或继续折中。'
            ],
            options: [
              {
                text: '强推新学，稳住纲纪',
                hint: '威望+3 · 势力+2 · 民心-1',
                effects: { prestige: 3, power: 2, public: -1 },
                flags: { set: ['stance_hard', 'protect_scholars'], clear: ['stance_soft'] }
              },
              {
                text: '兼容旧学，缓步推进',
                hint: '民心+3 · 忠诚+2',
                effects: { public: 3, loyalty: 2 },
                flags: { set: ['stance_soft', 'found_school'], clear: ['stance_hard'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c8',
        title: '江南春潮',
        nodes: [
          {
            id: 'c8.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '南征之令',
            location: '军帐',
            speaker: '参将',
            quote: '江南不服，则以兵问。',
            text: [
              '北方新政稳定后，南方诸国仍拥兵自重。你主张南征。',
              '这一战可夺富庶，但会耗尽粮草。'
            ],
            options: [
              {
                text: '挥师南下，夺取江南',
                hint: '军势+5 · 势力+3 · 银两-3',
                effects: { military: 5, power: 3, silver: -3 },
                flags: { set: ['stance_hard', 'support_south'], clear: ['stance_soft'] }
              },
              {
                text: '先遣使议和，探虚实',
                hint: '谋略+4 · 声望+2',
                effects: { strategy: 4, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c8.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '江南观潮',
            location: '沿江军镇',
            speaker: '水师统领',
            quote: '不必远征，也可控江。',
            text: [
              '你主张观望，水师驻守江口。南方使者频来示好。',
              '你可转向强硬，也可继续温和。'
            ],
            options: [
              {
                text: '整备水师，施压南国',
                hint: '军势+4 · 威望+3 · 银两-2',
                effects: { military: 4, prestige: 3, silver: -2 },
                flags: { set: ['stance_hard', 'support_south'], clear: ['stance_soft'] }
              },
              {
                text: '开放互市，稳住江面',
                hint: '银两+3 · 民心+2',
                effects: { silver: 3, public: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c8.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '南朝议事',
            location: '朝堂',
            speaker: '尚书',
            quote: '江南富，正可用来养兵。',
            text: [
              '你主张强势，要求南方诸国入贡听命。',
              '强硬或能换来臣服，也可能引发战事。'
            ],
            options: [
              {
                text: '下诏逼贡，显示威势',
                hint: '势力+4 · 威望+3 · 民心-1',
                effects: { power: 4, prestige: 3, public: -1 },
                flags: { set: ['stance_hard', 'support_south'], clear: ['stance_soft'] }
              },
              {
                text: '以礼相待，换取和约',
                hint: '声望+3 · 民心+2',
                effects: { reputation: 3, public: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c8.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '礼与兵',
            location: '内廷',
            speaker: '侍郎',
            quote: '礼可稳人心，兵可稳边界。',
            text: [
              '你主张温和，南方愿与北方通好。',
              '你可借机压制，或继续以礼相待。'
            ],
            options: [
              {
                text: '借机压制，夺取要地',
                hint: '势力+4 · 军势+2 · 民心-1',
                effects: { power: 4, military: 2, public: -1 },
                flags: { set: ['stance_hard', 'support_south'], clear: ['stance_soft'] }
              },
              {
                text: '继续通好，换取岁贡',
                hint: '银两+3 · 声望+2',
                effects: { silver: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c8.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '江南财路',
            location: '商议厅',
            speaker: '商会使者',
            quote: '江南水路，是金与兵的路。',
            text: [
              '你主张通过强势掌控江南财路。',
              '若能掌控，国库充盈，但商心难安。'
            ],
            options: [
              {
                text: '强控盐运，收拢银两',
                hint: '银两+6 · 势力+3 · 民心-2',
                effects: { silver: 6, power: 3, public: -2 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '签通商约，共享税利',
                hint: '银两+3 · 民心+2 · 声望+2',
                effects: { silver: 3, public: 2, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c8.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '春潮贸易',
            location: '江口市集',
            speaker: '商人',
            quote: '通商一开，船就不会停。',
            text: [
              '你主张温和，江南商贾愿以税利换通商。',
              '你可转向强征，或继续通商。'
            ],
            options: [
              {
                text: '提高关税，趁势收利',
                hint: '银两+4 · 威望+2 · 民心-1',
                effects: { silver: 4, prestige: 2, public: -1 },
                flags: { set: ['stance_hard', 'tax_raise'], clear: ['stance_soft'] }
              },
              {
                text: '稳住税率，护商路',
                hint: '民心+3 · 声望+2',
                effects: { public: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c8.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '江南檄书',
            location: '驿站',
            speaker: '使者',
            quote: '文书一到，江南即风。',
            text: [
              '你被派往江南，写下要求臣服的檄书。',
              '强硬会逼迫归附，也可能激起反抗。'
            ],
            options: [
              {
                text: '书以威胁，迫其称臣',
                hint: '威望+3 · 势力+2 · 民心-1',
                effects: { prestige: 3, power: 2, public: -1 },
                flags: { set: ['stance_hard', 'support_south'], clear: ['stance_soft'] }
              },
              {
                text: '以礼文安抚，求通好',
                hint: '声望+3 · 民心+2',
                effects: { reputation: 3, public: 2 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c8.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '江南雅集',
            location: '书院',
            speaker: '文友',
            quote: '雅集之下，亦是政治。',
            text: [
              '你主张温和，江南文士邀你雅集。',
              '你可借机推动归附，也可专心文化交往。'
            ],
            options: [
              {
                text: '借文会施压，推动归附',
                hint: '声望+3 · 势力+2 · 民心-1',
                effects: { reputation: 3, power: 2, public: -1 },
                flags: { set: ['stance_hard', 'support_south'], clear: ['stance_soft'] }
              },
              {
                text: '专作文艺，稳住民心',
                hint: '民心+3 · 威望+2',
                effects: { public: 3, prestige: 2 },
                flags: { set: ['stance_soft', 'found_school'], clear: ['stance_hard'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c9',
        title: '铁骑与船桥',
        nodes: [
          {
            id: 'c9.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '陈桥风雷',
            location: '禁军营',
            speaker: '副将',
            quote: '人心所向，军旗自转。',
            text: [
              '禁军拥立之声起，你被推到风口浪尖。',
              '你可顺势而上，也可压下异动。'
            ],
            options: [
              {
                text: '顺势拥立，夺取天命',
                hint: '势力+6 · 威望+3 · 忠诚-2',
                effects: { power: 6, prestige: 3, loyalty: -2 },
                flags: { set: ['stance_hard', 'seize_throne'], clear: ['stance_soft'] }
              },
              {
                text: '按下异动，守旧秩序',
                hint: '忠诚+4 · 声望+2',
                effects: { loyalty: 4, reputation: 2 },
                flags: { set: ['stance_soft', 'loyalty_oath'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c9.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '桥上风起',
            location: '陈桥驿',
            speaker: '军司',
            quote: '退一步，是保全还是错失。',
            text: [
              '你主张稳妥，却见军心激荡。拥立之势已起。',
              '你可转向夺权，或坚持守旧。'
            ],
            options: [
              {
                text: '接受众意，登坛誓师',
                hint: '势力+5 · 威望+3 · 忠诚-2',
                effects: { power: 5, prestige: 3, loyalty: -2 },
                flags: { set: ['stance_hard', 'seize_throne'], clear: ['stance_soft'] }
              },
              {
                text: '稳住军心，拒绝拥立',
                hint: '忠诚+4 · 民心+2',
                effects: { loyalty: 4, public: 2 },
                flags: { set: ['stance_soft', 'loyalty_oath'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c9.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '新朝在望',
            location: '内廷',
            speaker: '中书',
            quote: '拥立一事，胜者为王。',
            text: [
              '你主张强势拥立新主，旧朝官员惊惧。',
              '你要迅速稳住朝局，还是留退路。'
            ],
            options: [
              {
                text: '立新主，清理旧党',
                hint: '势力+6 · 威望+3 · 忠诚-2',
                effects: { power: 6, prestige: 3, loyalty: -2 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '安置旧臣，求稳定',
                hint: '忠诚+4 · 声望+2',
                effects: { loyalty: 4, reputation: 2 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c9.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '旧朝余音',
            location: '朝堂',
            speaker: '侍郎',
            quote: '守旧未必错，错在无势。',
            text: [
              '你倾向守旧，但军心已转。',
              '你可拥立新主，也可坚持旧法。'
            ],
            options: [
              {
                text: '转向拥立，顺势而为',
                hint: '势力+4 · 威望+3 · 忠诚-1',
                effects: { power: 4, prestige: 3, loyalty: -1 },
                flags: { set: ['stance_hard', 'purge_court'], clear: ['stance_soft'] }
              },
              {
                text: '稳住旧臣，维持秩序',
                hint: '忠诚+4 · 民心+2',
                effects: { loyalty: 4, public: 2 },
                flags: { set: ['stance_soft', 'coopt_elites'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c9.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '军需之桥',
            location: '陈桥仓',
            speaker: '粮官',
            quote: '谁控粮草，谁控军心。',
            text: [
              '军队拥立已起，你主张先控粮草。',
              '粮草充足可稳军，但商心将受损。'
            ],
            options: [
              {
                text: '集中粮草，稳住新军',
                hint: '银两+4 · 军势+3 · 民心-2',
                effects: { silver: 4, military: 3, public: -2 },
                flags: { set: ['stance_hard', 'seize_throne'], clear: ['stance_soft'] }
              },
              {
                text: '分散粮草，防止失控',
                hint: '谋略+3 · 民心+2',
                effects: { strategy: 3, public: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c9.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '桥畔市声',
            location: '市集',
            speaker: '商人',
            quote: '乱世里，生意最怕军心。',
            text: [
              '你主张稳市，商人担心军变。',
              '你可支持拥立以求新秩序，或继续守旧。'
            ],
            options: [
              {
                text: '支持拥立，换新秩序',
                hint: '势力+3 · 银两+3 · 民心-1',
                effects: { power: 3, silver: 3, public: -1 },
                flags: { set: ['stance_hard', 'seize_throne'], clear: ['stance_soft'] }
              },
              {
                text: '维持旧序，保商路',
                hint: '民心+3 · 声望+2',
                effects: { public: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'trade_open'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c9.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '新朝檄令',
            location: '文馆',
            speaker: '史官',
            quote: '史书一写，新朝便定。',
            text: [
              '拥立风声大作，你被要求撰写新朝檄令。',
              '你可直接承认新朝，也可强调旧序。'
            ],
            options: [
              {
                text: '撰写拥立檄，定新名分',
                hint: '声望+4 · 势力+3 · 忠诚-1',
                effects: { reputation: 4, power: 3, loyalty: -1 },
                flags: { set: ['stance_hard', 'seize_throne'], clear: ['stance_soft'] }
              },
              {
                text: '强调旧序，留文脉',
                hint: '忠诚+3 · 民心+2',
                effects: { loyalty: 3, public: 2 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c9.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '桥上清议',
            location: '书院',
            speaker: '学友',
            quote: '清议难制，但能定心。',
            text: [
              '你主张守旧，书院里议论拥立。',
              '你可顺势赞同，也可继续反对。'
            ],
            options: [
              {
                text: '顺势赞同，护文脉',
                hint: '声望+3 · 势力+2 · 忠诚-1',
                effects: { reputation: 3, power: 2, loyalty: -1 },
                flags: { set: ['stance_hard', 'seize_throne'], clear: ['stance_soft'] }
              },
              {
                text: '坚守旧序，守清议',
                hint: '忠诚+4 · 威望+2',
                effects: { loyalty: 4, prestige: 2 },
                flags: { set: ['stance_soft', 'protect_scholars'], clear: ['stance_hard'] }
              }
            ]
          }
        ]
      },
      {
        id: 'c10',
        title: '一统之门',
        nodes: [
          {
            id: 'c10.mil.hard',
            route: 'military',
            requires: { flags: ['stance_hard'] },
            title: '万军归一',
            location: '黄河渡口',
            speaker: '主将',
            quote: '一统在此，不退。',
            text: [
              '你选择强硬，最后一战近在眼前。众军看你旗号。',
              '你将决定以战一统，还是以和收尾。'
            ],
            options: [
              {
                text: '决战收尾，以武定天下',
                hint: '军势+5 · 威望+3 · 民心-2',
                effects: { military: 5, prestige: 3, public: -2 },
                flags: { set: ['stance_hard', 'final_war'], clear: ['stance_soft'] }
              },
              {
                text: '议和收编，以和定势',
                hint: '声望+4 · 民心+3 · 威望-1',
                effects: { reputation: 4, public: 3, prestige: -1 },
                flags: { set: ['stance_soft', 'final_peace'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c10.mil.soft',
            route: 'military',
            requires: { flags: ['stance_soft'] },
            title: '收束之战',
            location: '军中大营',
            speaker: '谋士',
            quote: '缓一步，或可免一城血。',
            text: [
              '你倾向温和，诸镇仍不服。最后的选择摆在你面前。',
              '是以战收束，还是以和安抚。'
            ],
            options: [
              {
                text: '转为强攻，立天下之名',
                hint: '军势+4 · 威望+3 · 民心-2',
                effects: { military: 4, prestige: 3, public: -2 },
                flags: { set: ['stance_hard', 'final_war'], clear: ['stance_soft'] }
              },
              {
                text: '坚持和议，纳降诸镇',
                hint: '声望+3 · 民心+3',
                effects: { reputation: 3, public: 3 },
                flags: { set: ['stance_soft', 'final_peace'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c10.court.hard',
            route: 'court',
            requires: { flags: ['stance_hard'] },
            title: '一统诏书',
            location: '金殿',
            speaker: '宰辅',
            quote: '天下既定，诏书先行。',
            text: [
              '你主张强势收束，天下归心在此一诏。',
              '你要以威令收束，还是以礼法收束。'
            ],
            options: [
              {
                text: '以威令压服诸镇',
                hint: '势力+5 · 威望+3 · 民心-2',
                effects: { power: 5, prestige: 3, public: -2 },
                flags: { set: ['stance_hard', 'final_war'], clear: ['stance_soft'] }
              },
              {
                text: '以礼法收束，安民心',
                hint: '声望+4 · 民心+3',
                effects: { reputation: 4, public: 3 },
                flags: { set: ['stance_soft', 'final_peace'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c10.court.soft',
            route: 'court',
            requires: { flags: ['stance_soft'] },
            title: '最后议和',
            location: '内廷',
            speaker: '侍中',
            quote: '最后一议，定天下之心。',
            text: [
              '你倾向和议，但诸镇仍观望。',
              '你可转向强势，也可继续安抚。'
            ],
            options: [
              {
                text: '转向强势，一举收束',
                hint: '势力+4 · 威望+3 · 民心-2',
                effects: { power: 4, prestige: 3, public: -2 },
                flags: { set: ['stance_hard', 'final_war'], clear: ['stance_soft'] }
              },
              {
                text: '坚持和议，换取归心',
                hint: '声望+3 · 民心+3',
                effects: { reputation: 3, public: 3 },
                flags: { set: ['stance_soft', 'final_peace'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c10.fiscal.hard',
            route: 'fiscal',
            requires: { flags: ['stance_hard'] },
            title: '天下财权',
            location: '户部',
            speaker: '度支使',
            quote: '财权归一，天下才能归一。',
            text: [
              '你主张强势整合财权，最后一役需耗尽银两。',
              '你要集中财权开战，或留财力安民。'
            ],
            options: [
              {
                text: '集中财权，供最后一战',
                hint: '银两+4 · 军势+3 · 民心-2',
                effects: { silver: 4, military: 3, public: -2 },
                flags: { set: ['stance_hard', 'final_war'], clear: ['stance_soft'] }
              },
              {
                text: '减税安民，稳住市面',
                hint: '民心+4 · 声望+2 · 银两-2',
                effects: { public: 4, reputation: 2, silver: -2 },
                flags: { set: ['stance_soft', 'final_peace'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c10.fiscal.soft',
            route: 'fiscal',
            requires: { flags: ['stance_soft'] },
            title: '安民之账',
            location: '市舶司',
            speaker: '商会',
            quote: '商路通，则天下通。',
            text: [
              '你倾向安民，商路初稳。最后的决断仍在。',
              '你可转向战时财权，或继续以商稳国。'
            ],
            options: [
              {
                text: '转向战时财权，收束诸镇',
                hint: '银两+3 · 军势+2 · 民心-2',
                effects: { silver: 3, military: 2, public: -2 },
                flags: { set: ['stance_hard', 'final_war'], clear: ['stance_soft'] }
              },
              {
                text: '继续通商，以财稳国',
                hint: '民心+3 · 声望+2',
                effects: { public: 3, reputation: 2 },
                flags: { set: ['stance_soft', 'final_peace'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c10.scholar.hard',
            route: 'scholar',
            requires: { flags: ['stance_hard'] },
            title: '定史之笔',
            location: '史馆',
            speaker: '史官',
            quote: '史书一落，天下有名。',
            text: [
              '你主张以强势收束，史书要为新朝立名。',
              '你要强调武功，还是强调仁治。'
            ],
            options: [
              {
                text: '立武功为先，扬威四海',
                hint: '威望+3 · 势力+2 · 民心-1',
                effects: { prestige: 3, power: 2, public: -1 },
                flags: { set: ['stance_hard', 'final_war'], clear: ['stance_soft'] }
              },
              {
                text: '以仁治为先，安民心',
                hint: '声望+3 · 民心+3',
                effects: { reputation: 3, public: 3 },
                flags: { set: ['stance_soft', 'final_peace'], clear: ['stance_hard'] }
              }
            ]
          },
          {
            id: 'c10.scholar.soft',
            route: 'scholar',
            requires: { flags: ['stance_soft'] },
            title: '归心之文',
            location: '书院',
            speaker: '门生',
            quote: '文字可安人心。',
            text: [
              '你倾向安民，但新朝仍未稳。',
              '你可转向强硬，或继续以文安民。'
            ],
            options: [
              {
                text: '转向强硬，立武功',
                hint: '威望+3 · 势力+2 · 民心-1',
                effects: { prestige: 3, power: 2, public: -1 },
                flags: { set: ['stance_hard', 'final_war'], clear: ['stance_soft'] }
              },
              {
                text: '坚持安民，守文脉',
                hint: '民心+4 · 声望+2',
                effects: { public: 4, reputation: 2 },
                flags: { set: ['stance_soft', 'final_peace'], clear: ['stance_hard'] }
              }
            ]
          }
        ]
      }
    ],
    endings: [
      {
        id: 'end-military-glory',
        route: 'military',
        title: '铁骑一统',
        requires: { stats: { military: { gte: 80 }, prestige: { gte: 70 } }, flags: ['final_war'] },
        text: [
          '你以铁骑收束乱世，诸镇尽归，军中传你的名号。',
          '血与火换来新秩序，你的威望如山。'
        ]
      },
      {
        id: 'end-military-peace',
        route: 'military',
        title: '和议定鼎',
        requires: { stats: { public: { gte: 70 } }, flags: ['final_peace'] },
        text: [
          '你以议和收束天下，诸镇纳降，战火渐息。',
          '百姓记得的是安定，而非血腥。'
        ]
      },
      {
        id: 'end-military-fall',
        route: 'military',
        title: '军旗折断',
        text: [
          '你未能稳住军心，诸镇离散。',
          '乱世继续，你的名字留在尘土里。'
        ]
      },
      {
        id: 'end-court-stability',
        route: 'court',
        title: '金殿定鼎',
        requires: { stats: { power: { gte: 75 }, strategy: { gte: 70 } } },
        text: [
          '你在朝堂稳住权力，法度重建，百官归心。',
          '新朝虽冷，却不再动荡。'
        ]
      },
      {
        id: 'end-court-virtue',
        route: 'court',
        title: '德治归心',
        requires: { stats: { reputation: { gte: 70 }, public: { gte: 70 } }, flags: ['final_peace'] },
        text: [
          '你以德服人，朝堂不再血腥。',
          '新秩序在温和中站稳。'
        ]
      },
      {
        id: 'end-court-fall',
        route: 'court',
        title: '帷幕崩塌',
        text: [
          '权力无法持续，旧党反扑，朝堂崩裂。',
          '你退居幕后，成为史书的一笔。'
        ]
      },
      {
        id: 'end-fiscal-prosper',
        route: 'fiscal',
        title: '商路如织',
        requires: { stats: { silver: { gte: 80 }, public: { gte: 65 } } },
        text: [
          '你以财稳国，商路四通，百姓渐安。',
          '财富成了你的护城河。'
        ]
      },
      {
        id: 'end-fiscal-might',
        route: 'fiscal',
        title: '财权一统',
        requires: { stats: { silver: { gte: 80 }, power: { gte: 65 } }, flags: ['final_war'] },
        text: [
          '你用财权支撑武力，一统得以完成。',
          '国库充盈，但人心仍需抚慰。'
        ]
      },
      {
        id: 'end-fiscal-fall',
        route: 'fiscal',
        title: '银尽城空',
        text: [
          '税赋失衡，民怨积聚，商路崩裂。',
          '财富未能救你脱身。'
        ]
      },
      {
        id: 'end-scholar-canon',
        route: 'scholar',
        title: '文脉承天',
        requires: { stats: { prestige: { gte: 75 }, reputation: { gte: 70 } }, flags: ['final_peace'] },
        text: [
          '你以文脉安天下，史书将你列为治世之臣。',
          '刀兵渐息，笔墨得以长存。'
        ]
      },
      {
        id: 'end-scholar-blood',
        route: 'scholar',
        title: '笔为刀锋',
        requires: { stats: { strategy: { gte: 80 } }, flags: ['final_war'] },
        text: [
          '你以笔为刃，辅助强势收束天下。',
          '史书将记你为冷峻的开国之笔。'
        ]
      },
      {
        id: 'end-scholar-fall',
        route: 'scholar',
        title: '书院残灯',
        text: [
          '你未能护住士人，书院散去，清议成风。',
          '你的故事在乱世中被湮没。'
        ]
      },
      {
        id: 'end-any',
        route: 'any',
        title: '乱世余烬',
        text: [
          '天下未定，你在史册的缝隙里留下姓名。',
          '乱世仍在继续。'
        ]
      }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  } else {
    global.GAME_DATA = data;
  }
})(typeof window !== 'undefined' ? window : global);
