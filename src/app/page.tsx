import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="メインナビゲーション">
        <span className="wordmark">DANCE HUB</span>
        <Link className="button button-quiet" href="/login">Organizer login</Link>
      </nav>
      <section className="landing-hero">
        <p className="eyebrow">Dance information, held with care.</p>
        <h1>踊りの現在を、<br />未来の記録へ。</h1>
        <p className="landing-copy">
          DANCE HUBは、東京・神奈川のEvent、Artist、Venue、Organizationを
          つなぎ、公開とアーカイブを支える情報基盤です。
        </p>
        <div className="button-row">
          <Link className="button button-primary" href="/login">Organization業務を始める</Link>
          <a className="button button-secondary" href="#about">MVPについて</a>
        </div>
      </section>
      <section className="landing-about" id="about">
        <p className="eyebrow">M2 / Identity &amp; Onboarding</p>
        <div>
          <h2>承認された主体だけが、確かな情報を育てる。</h2>
          <p>
            Organizerの申請からPlatform Adminの審査、初期Ownerの付与までを
            ひとつの安全なworkflowとして提供します。
          </p>
        </div>
      </section>
    </main>
  );
}
