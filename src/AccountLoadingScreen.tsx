import { Building2, Users, Megaphone } from 'lucide-react'

type Props = {
  accountType: 'society' | 'brand'
}

export default function AccountLoadingScreen({ accountType }: Props) {
  const isSociety = accountType === 'society'

  return (
    <>
      <style>{`
        .account-loading {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
          overflow: hidden;
          color: white;
          background:
            radial-gradient(ellipse at 50% 35%, #173b68 0%, transparent 48%),
            linear-gradient(145deg, #071426, #0b1930 55%, #101d38);
          animation: accountFadeIn .45s ease both;
        }

        .account-loading-content {
          width: 100%;
          max-width: 440px;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .account-loading-logo {
          width: 92px;
          height: 92px;
          display: grid;
          place-items: center;
          margin: 0 auto 28px;
          color: #8ec5ff;
          border: 1px solid rgba(142,197,255,.35);
          border-radius: 28px;
          background: rgba(255,255,255,.07);
          box-shadow: 0 0 55px rgba(59,130,246,.22);
          animation: accountFloat 2.5s ease-in-out infinite;
        }

        .account-loading-logo svg {
          width: 46px;
          height: 46px;
          stroke-width: 1.5;
        }

        .account-loading-brand {
          font-size: 34px;
          font-weight: 750;
          letter-spacing: -1.5px;
        }

        .account-loading-brand span {
          color: #72b7ff;
        }

        .account-loading-tagline {
          margin-top: 9px;
          color: #a9bfd9;
          font-size: 14px;
        }

        .account-loading-divider {
          width: 52px;
          height: 3px;
          margin: 30px auto;
          border-radius: 20px;
          background: #5daeff;
          box-shadow: 0 0 16px #5daeff;
        }

        .account-loading-title {
          font-size: 21px;
          font-weight: 650;
          letter-spacing: -.4px;
        }

        .account-loading-description {
          margin-top: 10px;
          color: #a9bfd9;
          font-size: 13px;
          line-height: 1.7;
        }

        .account-loading-track {
          height: 5px;
          margin: 30px auto 13px;
          overflow: hidden;
          border-radius: 20px;
          background: rgba(255,255,255,.12);
        }

        .account-loading-progress {
          width: 40%;
          height: 100%;
          border-radius: 20px;
          background: linear-gradient(90deg, #3989f7, #8bd1ff);
          box-shadow: 0 0 15px rgba(96,165,250,.7);
          animation: accountProgress 1.8s ease-in-out infinite;
        }

        .account-loading-caption {
          color: #7894b4;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .account-loading-decoration {
          position: absolute;
          color: rgba(142,197,255,.08);
          pointer-events: none;
        }

        .account-loading-decoration.left {
          left: 8%;
          bottom: 12%;
        }

        .account-loading-decoration.right {
          right: 8%;
          top: 14%;
        }

        @keyframes accountProgress {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(270%); }
        }

        @keyframes accountFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @keyframes accountFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .account-loading *,
          .account-loading *::before {
            animation: none !important;
          }
        }
      `}</style>

      <div className="account-loading" role="status" aria-live="polite">
        <Building2 className="account-loading-decoration left" size={180} />
        {isSociety
          ? <Users className="account-loading-decoration right" size={110} />
          : <Megaphone className="account-loading-decoration right" size={110} />}

        <div className="account-loading-content">
          <div className="account-loading-logo">
            {isSociety ? <Building2 /> : <Megaphone />}
          </div>

          <div className="account-loading-brand">
            Ad<span>Society</span>
          </div>

          <p className="account-loading-tagline">
            Where communities meet brands.
          </p>

          <div className="account-loading-divider" />

          <div className="account-loading-title">
            {isSociety
              ? 'Preparing your society workspace...'
              : 'Preparing your brand marketplace...'}
          </div>

          <p className="account-loading-description">
            {isSociety
              ? 'Organising your inventory, sponsorships and bookings.'
              : 'Discovering advertising spaces and community opportunities.'}
          </p>

          <div className="account-loading-track">
            <div className="account-loading-progress" />
          </div>

          <div className="account-loading-caption">
            Connecting · Organising · Getting ready
          </div>
        </div>
      </div>
    </>
  )
}