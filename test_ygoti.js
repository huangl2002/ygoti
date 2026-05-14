// YGOTI 自测脚本 — 模拟30次答题并生成报告 (优化版: 24题/3正3负平衡)
const fs = require('fs');

const questions = [
  { text: "先手你会优先做最大场，哪怕对面手里可能有陨石", dim: "CR", dir: 1 },
  { text: "一套combo打完场子铺满的感觉比赢牌本身还爽", dim: "CR", dir: 1 },
  { text: "展开被灰流丽打断你会当场血压拉满", dim: "CR", dir: 1 },
  { text: "比起说书式展开，你更喜欢见招拆招、看情况灵活应对", dim: "CR", dir: -1 },
  { text: "对面回合你手里没康会感到很不安", dim: "CR", dir: -1 },
  { text: "看到对面空场，你脑中只有一个念头：进战阶OTK", dim: "AD", dir: 1 },
  { text: "高攻大怪一拳灌过去就是牌佬的终极浪漫", dim: "AD", dir: 1 },
  { text: "最好的防御就是进攻——把对面LP归零完事", dim: "AD", dir: 1 },
  { text: "比起OTK的爽快，你更喜欢用坑和阻抗慢慢消磨对手意志", dim: "AD", dir: -1 },
  { text: "后手突破失败带来的挫败感远比先手被解大", dim: "AD", dir: -1 },
  { text: "即使你的本命卡组在饼图垫底，你也绝不会换", dim: "SM", dir: 1 },
  { text: "用娱乐卡组偷死主流卡组是你整个月最爽的瞬间", dim: "SM", dir: 1 },
  { text: "你会因为一张卡卡图好看而把它硬塞进主卡组", dim: "SM", dir: 1 },
  { text: "什么强玩什么，跟上环境才是正道", dim: "SM", dir: -1 },
  { text: "看到两套一模一样的主流镜像对局，你觉得这才是真正的博弈", dim: "SM", dir: -1 },
  { text: "五分钟以上的对局让你想拔网线", dim: "QG", dir: 1 },
  { text: "速战速决是你的信条，打完赶紧下一把", dim: "QG", dir: 1 },
  { text: "对方每回合烧绳子思考三分钟会让你抓狂", dim: "QG", dir: 1 },
  { text: "长盘拉锯中通过资源管理慢慢磨死对手让你成就感满满", dim: "QG", dir: -1 },
  { text: "超过20回合的对局是一场精彩的博弈而非折磨", dim: "QG", dir: -1 },
  // 平衡补充题 (每维+1反向, 3正3负, 共24题)
  { text: "你享受一步步拆解对手防线的过程，而不是依赖预设combo一波带走", dim: "CR", dir: -1 },
  { text: "你宁可多盖几张坑稳扎稳打，也不愿冒险贪伤害被反杀", dim: "AD", dir: -1 },
  { text: "卡组强度是第一位的，比赛上位比魂卡自嗨更有说服力", dim: "SM", dir: -1 },
  { text: "一场拉锯打满30分钟，每一步博弈都让你更专注而非烦躁", dim: "QG", dir: -1 },
];

const types = {
  CASQ: { name: "魂之OTK", alias: "用本命卡组一拳终结对手", decks: ["电子龙", "青眼白龙"] },
  CASG: { name: "英雄本色", alias: "融合之光永不熄灭", decks: ["英雄", "青眼白龙"] },
  CAMQ: { name: "疾风怒涛", alias: "最快最强的竞技猎手", decks: ["龙link", "斩机"] },
  CAMG: { name: "深渊领主", alias: "用最强体系碾压一切", decks: ["珠泪", "蛇眼"] },
  CDSQ: { name: "暗影奇袭", alias: "从墓地发动的致命一击", decks: ["幻影骑士团", "转生炎兽"] },
  CDSG: { name: "经典咏流传", alias: "同调是男人永远的浪漫", decks: ["废二", "码语者"] },
  CDMQ: { name: "速攻铁壁", alias: "竞技场上的效率控场者", decks: ["铁兽", "相剑"] },
  CDMG: { name: "铁壁构筑", alias: "长盘中的不败堡垒", decks: ["烙印", "铁兽"] },
  RASQ: { name: "魂之拳", alias: "简单直接地揍翻对手", decks: ["青眼白龙", "电子龙"] },
  RASG: { name: "闪耀风暴", alias: "用光芒照亮整个决斗场", decks: ["青眼白龙", "淘气仙星"] },
  RAMQ: { name: "速攻制胜", alias: "高效就是最强的武器", decks: ["十二兽", "蛇眼"] },
  RAMG: { name: "霸道总裁", alias: "全场都在我掌控之中", decks: ["俱舍怒威族", "珠泪"] },
  RDSQ: { name: "阴间小清新", alias: "陷阱是最高级的艺术", decks: ["虫惑魔", "御巫"] },
  RDSG: { name: "古之壁", alias: "历经风雨而不倒的老兵", decks: ["真龙", "黄金国"] },
  RDMQ: { name: "王牌机师", alias: "孤高而精准的操控者", decks: ["闪刀姬"] },
  RDMG: { name: "深渊掌控", alias: "在长盘中最恐怖的对手", decks: ["白银城", "神碑"] },
};

// 三种答题策略，各10遍，模拟不同玩家风格
const strategies = [
  { name: "完全随机", fn: () => Math.floor(Math.random() * 5) + 1, count: 10 },
  { name: "偏好极端 (倾向选1或5)", fn: () => Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : 5) : Math.floor(Math.random() * 5) + 1, count: 10 },
  { name: "偏好中立 (倾向选3)", fn: () => Math.random() < 0.5 ? 3 : Math.floor(Math.random() * 5) + 1, count: 10 },
];

function runOneTest(strategyFn) {
  const answers = questions.map(() => strategyFn());
  const scores = { CR: 0, AD: 0, SM: 0, QG: 0 };
  const counts = { CR: 0, AD: 0, SM: 0, QG: 0 };
  const dimAnswers = { CR: [], AD: [], SM: [], QG: [] };

  questions.forEach((q, i) => {
    scores[q.dim] += answers[i] * q.dir;
    counts[q.dim] += 5;
    dimAnswers[q.dim].push(q.dir === 1 ? answers[i] : (6 - answers[i]));
  });

  const pcts = {};
  const borderline = [];
  for (const dim of ['CR', 'AD', 'SM', 'QG']) {
    const maxScore = counts[dim];
    pcts[dim] = Math.round(((scores[dim] + maxScore) / (2 * maxScore)) * 100);
    if (pcts[dim] >= 45 && pcts[dim] <= 55) borderline.push(dim);
  }

  function stddev(arr) {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  }
  const consistency = {};
  let consistentDims = 0;
  for (const dim of ['CR', 'AD', 'SM', 'QG']) {
    const std = stddev(dimAnswers[dim]);
    consistency[dim] = std < 1.0 ? 'high' : (std < 1.5 ? 'mid' : 'low');
    if (consistency[dim] === 'high') consistentDims++;
  }
  let reliability = 'high';
  if (consistentDims <= 2) reliability = 'low';
  else if (consistentDims === 3) reliability = 'mid';

  const typeCode =
    (pcts.CR >= 50 ? 'C' : 'R') +
    (pcts.AD >= 50 ? 'A' : 'D') +
    (pcts.SM >= 50 ? 'S' : 'M') +
    (pcts.QG >= 50 ? 'Q' : 'G');

  return { answers, scores, pcts, typeCode, borderline, consistency, reliability };
}

// ===== 执行30次测试 =====
console.log("=".repeat(76));
console.log("               YGOTI 30次自测报告 (优化版 · 24题/3正3负平衡)");
console.log("=".repeat(76));

const allResults = [];
const strategyResults = {};

for (const strat of strategies) {
  const results = [];
  for (let i = 0; i < strat.count; i++) {
    const r = runOneTest(strat.fn);
    results.push(r);
    allResults.push({ ...r, strategy: strat.name });
  }
  strategyResults[strat.name] = results;
}

// ===== 1. 每次测试结果 =====
console.log("\n\n一、30次测试详细结果\n");
console.log("序号  策略          CR%  AD%  SM%  QG%  类型码     人格名称        边界  可信");
console.log("-".repeat(76));

const conIcons = { high: '✓', mid: '⚠', low: '✗' };
const relLabels = { high: '高', mid: '中', low: '低' };

allResults.forEach((r, i) => {
  const t = types[r.typeCode];
  const bStr = r.borderline.length > 0 ? r.borderline.join('') : '-';
  console.log(
    `#${String(i + 1).padStart(2)}  ${r.strategy.padEnd(12)} ${String(r.pcts.CR).padStart(3)} ${String(r.pcts.AD).padStart(4)} ${String(r.pcts.SM).padStart(4)} ${String(r.pcts.QG).padStart(4)}  ${r.typeCode.padEnd(8)} ${t.name.padEnd(12)} ${bStr.padEnd(4)} ${relLabels[r.reliability]}`
  );
});

// ===== 2. 类型分布统计 =====
console.log("\n\n二、16种人格类型分布统计\n");
const typeCounts = {};
allResults.forEach(r => {
  if (!typeCounts[r.typeCode]) typeCounts[r.typeCode] = 0;
  typeCounts[r.typeCode]++;
});

const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
console.log("类型码    人格名称            出现次数  占比    推荐卡组");
console.log("-".repeat(76));
sortedTypes.forEach(([code, count]) => {
  const t = types[code];
  const pct = ((count / 30) * 100).toFixed(1);
  const bar = "█".repeat(count);
  console.log(
    `${code.padEnd(8)} ${t.name.padEnd(18)} ${String(count).padStart(2)}     ${pct.padStart(5)}%  ${bar} ${t.decks.join(" / ")}`
  );
});

// ===== 3. 未出现的类型 =====
console.log("\n\n三、未出现的类型");
const appearedCodes = new Set(Object.keys(typeCounts));
const allCodes = Object.keys(types);
const missing = allCodes.filter(c => !appearedCodes.has(c));
if (missing.length === 0) {
  console.log("  ✓ 所有16种类型均已出现");
} else {
  missing.forEach(c => {
    console.log(`  ✗ ${c} (${types[c].name}) — ${types[c].alias}`);
  });
}

// ===== 4. 维度倾向统计 =====
console.log("\n\n四、四维度整体倾向分布\n");
const dimNames = { CR: "展开/应对", AD: "强攻/防守", SM: "魂系/竞技", QG: "速攻/持久" };
const dimLabels = { CR: ["C展开", "R应对"], AD: ["A强攻", "D防守"], SM: ["S魂系", "M竞技"], QG: ["Q速攻", "G持久"] };

for (const dim of ['CR', 'AD', 'SM', 'QG']) {
  const leftCount = allResults.filter(r => r.pcts[dim] >= 50).length;
  const rightCount = 30 - leftCount;
  const borderlineCount = allResults.filter(r => r.borderline.includes(dim)).length;
  const avgPct = Math.round(allResults.reduce((s, r) => s + r.pcts[dim], 0) / 30);
  console.log(`  ${dim} ${dimNames[dim]}:  ${dimLabels[dim][0]}=${leftCount}次(${((leftCount/30)*100).toFixed(0)}%)  ${dimLabels[dim][1]}=${rightCount}次(${((rightCount/30)*100).toFixed(0)}%)  边界=${borderlineCount}次  平均偏向=${avgPct}%`);
}

// ===== 5. 各维度分数分布 =====
console.log("\n\n五、各维度百分比分布 (30次)\n");
for (const dim of ['CR', 'AD', 'SM', 'QG']) {
  const values = allResults.map(r => r.pcts[dim]).sort((a, b) => a - b);
  const min = values[0];
  const max = values[29];
  const median = values[14];
  const q1 = values[7];
  const q3 = values[22];
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / 30);
  console.log(`  ${dim} (${dimNames[dim]}): min=${min}%  Q1=${q1}%  中位数=${median}%  Q3=${q3}%  max=${max}%  均值=${avg}%`);
  const buckets = { "0-19": 0, "20-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 };
  values.forEach(v => {
    if (v < 20) buckets["0-19"]++;
    else if (v < 40) buckets["20-39"]++;
    else if (v < 60) buckets["40-59"]++;
    else if (v < 80) buckets["60-79"]++;
    else buckets["80-100"]++;
  });
  process.stdout.write(`    分布: `);
  for (const [range, count] of Object.entries(buckets)) {
    if (count > 0) process.stdout.write(`${range}: ${String(count).padStart(2)}次  `);
  }
  console.log();
}

// ===== 6. 卡组推荐频率 =====
console.log("\n\n六、推荐卡组出现频率\n");
const deckCounts = {};
allResults.forEach(r => {
  const t = types[r.typeCode];
  t.decks.forEach(d => {
    if (!deckCounts[d]) deckCounts[d] = 0;
    deckCounts[d]++;
  });
});
const sortedDecks = Object.entries(deckCounts).sort((a, b) => b[1] - a[1]);
sortedDecks.forEach(([deck, count]) => {
  const pct = ((count / 30) * 100).toFixed(1);
  const bar = "█".repeat(Math.round(count / 30 * 50));
  console.log(`  ${deck.padEnd(14)} ${String(count).padStart(2)}次 (${pct.padStart(5)}%) ${bar}`);
});

// ===== 7. 按策略分组统计 =====
console.log("\n\n七、按答题策略分组统计\n");
for (const strat of strategies) {
  const results = strategyResults[strat.name];
  const typeDist = {};
  results.forEach(r => {
    if (!typeDist[r.typeCode]) typeDist[r.typeCode] = 0;
    typeDist[r.typeCode]++;
  });
  const uniqueTypes = Object.keys(typeDist).length;
  console.log(`\n  [${strat.name}] (${results.length}次)`);
  console.log(`  出现类型数: ${uniqueTypes}/16`);
  const topType = Object.entries(typeDist).sort((a, b) => b[1] - a[1])[0];
  console.log(`  最常见: ${topType[0]} (${types[topType[0]].name}) x${topType[1]}`);
}

// ===== 8. 边界与一致性统计 =====
console.log("\n\n八、边界维度与可信度统计\n");
const borderlineCountDist = {};
const reliabilityDist = {};
allResults.forEach(r => {
  const bc = r.borderline.length;
  if (!borderlineCountDist[bc]) borderlineCountDist[bc] = 0;
  borderlineCountDist[bc]++;
  if (!reliabilityDist[r.reliability]) reliabilityDist[r.reliability] = 0;
  reliabilityDist[r.reliability]++;
});
console.log("  边界维度数分布:");
for (const [k, v] of Object.entries(borderlineCountDist).sort()) {
  console.log(`    ${k}个维度处于边界: ${v}次 (${(v/30*100).toFixed(0)}%)`);
}
console.log("  可信度分布:");
const relOrder = ['high', 'mid', 'low'];
relOrder.forEach(r => {
  if (reliabilityDist[r]) console.log(`    ${relLabels[r]}: ${reliabilityDist[r]}次 (${(reliabilityDist[r]/30*100).toFixed(0)}%)`);
});

// ===== 9. 优化效果对比 =====
console.log("\n\n" + "=".repeat(76));
console.log("九、优化效果对比 (优化前 vs 优化后)");
console.log("=".repeat(76));

console.log(`
  ┌────────────────────┬──────────────┬──────────────┐
  │      指标          │  优化前(20题) │  优化后(24题) │
  ├────────────────────┼──────────────┼──────────────┤
  │ 每维题目数         │  5 (3正2负)  │  6 (3正3负)  │
  │ 期望偏向(随机)     │  56% 偏左    │  50% 居中    │
  │ 覆盖类型数(30次)   │  6/16        │  待本次验证  │
  │ 最高频类型占比     │  56.7%       │  待本次验证  │
  │ 左右维度比         │  严重失衡    │  趋近50:50   │
  │ 模糊边界处理       │  无          │  45-55%标⚡   │
  │ 一致性检测         │  无          │  std<1.0✓    │
  └────────────────────┴──────────────┴──────────────┘`);

// 计算本次的实际统计
const lrCounts = {};
for (const dim of ['CR', 'AD', 'SM', 'QG']) {
  const left = allResults.filter(r => r.pcts[dim] >= 50).length;
  const right = 30 - left;
  lrCounts[dim] = { left, right };
}
const typeCoverage = Object.keys(typeCounts).length;
const maxTypeFreq = sortedTypes.length > 0 ? (sortedTypes[0][1] / 30 * 100).toFixed(1) : '0';
console.log(`\n  本次实际结果:
  - 覆盖类型: ${typeCoverage}/16 (${(typeCoverage/16*100).toFixed(0)}%)
  - 最高频占比: ${maxTypeFreq}%
  - CR左右比: C=${lrCounts.CR.left} / R=${lrCounts.CR.right}
  - AD左右比: A=${lrCounts.AD.left} / D=${lrCounts.AD.right}
  - SM左右比: S=${lrCounts.SM.left} / M=${lrCounts.SM.right}
  - QG左右比: Q=${lrCounts.QG.left} / G=${lrCounts.QG.right}`);

// ===== 10. 剩余优化空间 =====
console.log("\n\n十、剩余优化空间\n");
console.log(`  已实现:
  ✓ 每维度3正3负题目平衡 → 消除系统偏差
  ✓ 模糊边界标记 (45-55% 显示 ⚡)
  ✓ 一致性检测 (同维答案标准差校验)
  ✓ 可信度评分 (高/中/低三档)

  未来可考虑:
  1. 每维增至8-10题 → 进一步提升信度与区分度
  2. Likert 5级→7级 → 更细致的梯度 (需重设全部选项)
  3. 引入"强度等级" → 极端型(70%+) vs 明显型 vs 混合型
  4. 收集真实玩家数据做因子分析 → 合并冗余维度、优化类型映射
  5. 副类型推荐 → 当多维度边界时同时展示第二可能的类型
  6. A/B测试不同题目表述 → 优化题目效度`);

console.log("\n" + "=".repeat(76));
console.log("报告完毕 — YGOTI 优化版 30次自测");
console.log("=".repeat(76));
