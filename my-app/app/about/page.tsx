export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">关于本站</h1>

      <div className="space-y-4 text-muted-foreground">
        <p>
          本站是一个展示中国 A 股每日热点信息的静态网站，数据每日收盘后自动更新。
        </p>

        <h2 className="text-lg font-semibold text-foreground">数据来源</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>AkShare — 开源免费金融数据接口</li>
          <li>Tushare — 备用/交叉验证（免费版）</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">数据维度</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>涨停榜 — 每日涨停个股列表</li>
          <li>板块热点 — 领涨板块与资金流向</li>
          <li>龙虎榜 — 上榜个股与机构/游资动向</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">更新频率</h2>
        <p>每日 17:00（收盘后）自动抓取并更新数据。</p>

        <div className="rounded-lg border p-4 bg-muted">
          <p className="font-medium text-foreground">免责声明</p>
          <p className="mt-2">
            本网站展示的数据仅供信息参考，不构成投资建议。数据来源于公开渠道，可能存在延迟或误差，使用者应自行核实。
          </p>
        </div>
      </div>
    </div>
  );
}
