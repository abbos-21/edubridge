import { useI18n } from '../../i18n/I18nProvider';
import { navigate } from '../../lib/router';
import { Tabs } from '../../components/ui';
import { AskTab } from './AskTab';
import { DocsTab } from './DocsTab';
import { InterviewTab } from './InterviewTab';
import { ReportTab } from './ReportTab';

type Tab = 'ask' | 'docs' | 'interview' | 'report';
const TABS: Tab[] = ['ask', 'docs', 'interview', 'report'];

/** The AI advisor: #assistant (Ask), #assistant--docs, #assistant--interview, #assistant--report. */
export function Assistant({ tab }: { tab: string | null }) {
  const { tx } = useI18n();
  const current: Tab = (TABS as string[]).includes(tab ?? '') ? (tab as Tab) : 'ask';
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">{tx('AI admissions advisor', 'SI qabul maslahatchisi')}</h1>
        <p className="text-sm text-muted">{tx('Honest, critical feedback grounded in EduBridge’s verified records. It never promises an offer or estimates your chances.', 'EduBridge’ning tasdiqlangan ma’lumotlariga asoslangan halol, tanqidiy fikr. U hech qachon qabulni va’da qilmaydi yoki ehtimolni baholamaydi.')}</p>
      </div>
      <Tabs
        label={tx('AI advisor', 'SI maslahatchi')}
        value={current}
        onChange={(t) => navigate('assistant', t === 'ask' ? null : t)}
        tabs={[
          { id: 'ask', label: tx('Ask', 'So‘rash') },
          { id: 'docs', label: tx('Documents', 'Hujjatlar') },
          { id: 'interview', label: tx('Interview', 'Suhbat') },
          { id: 'report', label: tx('Report', 'Hisobot') },
        ]}
      />
      <div role="tabpanel" id={`panel-${current}`} aria-labelledby={`tab-${current}`}>
        {current === 'ask' && <AskTab />}
        {current === 'docs' && <DocsTab />}
        {current === 'interview' && <InterviewTab />}
        {current === 'report' && <ReportTab />}
      </div>
    </div>
  );
}
