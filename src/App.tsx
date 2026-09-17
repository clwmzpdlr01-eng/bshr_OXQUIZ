import { type ReactNode, useEffect, useState } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  GraduationCap,
  HandHeart,
  Instagram,
  LockKeyhole,
  Mail,
  Megaphone,
  Pencil,
  RotateCcw,
  Save,
  Settings,
  Scale,
  ShieldCheck,
  Ticket,
  X,
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import './index.css';

type QuizAnswer = 'O' | 'X';
type QuizQuestion = {
  id: number;
  statement: string;
  answer: QuizAnswer;
  explanation: string;
};
type StoredResult = {
  score: number;
  answers: QuizAnswer[];
  finishedAt: string;
  verified: boolean;
  luckyUnlocked: boolean;
};

const defaultQuestions: QuizQuestion[] = [
  { id: 1, statement: "부산광역시인권센터의 '무료 법률상담'은 인권침해 및 차별 상담뿐만 아니라 유관기관 연계 서비스도 함께 지원한다.", answer: 'O', explanation: '그렇습니다! 센터는 인권침해 및 법률상담을 진행하고 필요시 유관기관과 연계하여 지원합니다.' },
  { id: 2, statement: '인권은 대한민국 국민이거나 특정 조건을 갖춘 사람에게만 주어지는 권리이며, 외국인이나 이주민에게는 적용되지 않는다.', answer: 'X', explanation: "인권은 국적, 인종, 성별과 상관없이 '인간이라는 이유만으로' 누구나 가지는 보편적 권리입니다." },
  { id: 3, statement: '찾아가는 시민인권교육이나 지방공사 등의 인권경영선언 추진은 센터의 주요 교육 사업에 해당한다.', answer: 'O', explanation: '맞습니다! 시민 대상 교육뿐만 아니라 공공기관 및 지방공사의 인권경영 확산을 위한 교육·지원도 활발히 펼치고 있습니다.' },
  { id: 4, statement: "단기 아르바이트생에게도 '수습 기간(3개월 미만)' 명목으로 최저임금의 90%만 주는 것은 적법하다.", answer: 'X', explanation: '1년 미만 근로계약이거나 단순 노무 종사자는 수습 기간이라도 최저임금 100% 전액 지급이 원칙입니다.' },
  { id: 5, statement: '부산인권주간 운영과 세계인권선언의 날 기념행사, 인권공모전은 시민들이 참여할 수 있는 대표적인 문화 사업이다.', answer: 'O', explanation: '맞습니다! 매년 인권주간과 공모전 등을 통해 다채로운 문화 행사를 운영하고 있습니다.' },
];

const QUESTIONS_KEY = 'busan-hr-quiz-questions';
const QUESTIONS_UPDATED_EVENT = 'busan-hr-questions-updated';
const RESULT_KEY = 'busan-hr-quiz-result';
const NEWSLETTER_KEY = 'busan-hr-quiz-newsletter';
const ACCESS_PASSWORD = '1472';
const ADMIN_SESSION_KEY = 'busan-hr-admin-unlocked';
const QUESTIONS_API = '/api/quiz-questions';

function isValidQuestions(value: unknown): value is QuizQuestion[] {
  return Array.isArray(value)
    && value.length === 5
    && value.every(question =>
      question
      && typeof question.id === 'number'
      && typeof question.statement === 'string'
      && (question.answer === 'O' || question.answer === 'X')
      && typeof question.explanation === 'string'
    );
}

function readQuestions(): QuizQuestion[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUESTIONS_KEY) || 'null');
    return isValidQuestions(parsed) ? parsed : defaultQuestions;
  } catch { return defaultQuestions; }
}

async function fetchRemoteQuestions(): Promise<QuizQuestion[] | null> {
  try {
    const response = await fetch(QUESTIONS_API, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') return null;
    const questions = (payload as { questions?: unknown }).questions;
    return isValidQuestions(questions) ? questions : null;
  } catch {
    return null;
  }
}

async function saveRemoteQuestions(questions: QuizQuestion[]): Promise<boolean> {
  try {
    const response = await fetch(QUESTIONS_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ACCESS_PASSWORD },
      body: JSON.stringify({ questions }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function resetRemoteQuestions(): Promise<boolean> {
  try {
    const response = await fetch(QUESTIONS_API, {
      method: 'DELETE',
      headers: { 'x-admin-password': ACCESS_PASSWORD },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function readResult(): StoredResult | null {
  try { return JSON.parse(localStorage.getItem(RESULT_KEY) || 'null'); } catch { return null; }
}

function Shell({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const [adminOpen, setAdminOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const openAdmin = () => {
    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'yes');
      setAdminOpen(false);
      setPassword('');
      setPasswordError(false);
      navigate('/admin');
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div className="paper-grain min-h-[100dvh] bg-white text-[#183a60]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-end border-b border-[#183a60]/10 px-5 py-4 md:px-8">
        <button
          type="button"
          onClick={() => { setAdminOpen(true); setPasswordError(false); }}
          aria-label="관리자 설정"
          title="관리자 설정"
          className="focus-ring rounded-full p-2 text-[#183a60]/45 transition-colors hover:bg-[#183a60]/8 hover:text-[#183a60]"
          data-testid="button-admin-settings"
        >
          <Settings size={17} strokeWidth={1.8} />
        </button>
      </header>
      <main>{children}</main>
      <footer className="mx-auto max-w-5xl px-5 pb-8 pt-10 text-xs text-[#183a60]/50 md:px-8">
        <div className="border-t border-[#183a60]/15 pt-5">부산광역시인권센터 · 인권 OX 퀴즈</div>
      </footer>
      {adminOpen && (
        <div className="admin-modal fixed inset-0 z-50 flex items-end justify-center bg-[#183a60]/25 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="관리자 모달 닫기" onClick={() => setAdminOpen(false)} />
          <div className="admin-modal-card relative w-full max-w-sm rounded-2xl border border-[#183a60]/12 bg-white p-6 shadow-[0_18px_55px_rgba(24,58,96,.18)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#183a60]">
                <Settings size={17} strokeWidth={1.8} />
                <h2 id="admin-modal-title" className="text-sm font-extrabold">관리자 설정</h2>
              </div>
              <button type="button" onClick={() => setAdminOpen(false)} className="focus-ring rounded-full p-1 text-[#183a60]/45 hover:bg-[#183a60]/8" aria-label="닫기">
                <X size={17} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#183a60]/60">관리자 비밀번호를 입력해 문항 편집 화면으로 이동합니다.</p>
            <input
              autoFocus
              value={password}
              onChange={event => { setPassword(event.target.value.replace(/\D/g, '').slice(0, 4)); setPasswordError(false); }}
              onKeyDown={event => { if (event.key === 'Enter' && password.length === 4) openAdmin(); }}
              inputMode="numeric"
              maxLength={4}
              placeholder="4자리 비밀번호"
              className="focus-ring mt-5 w-full rounded-xl border border-[#183a60]/18 bg-white px-4 py-3 text-center text-lg font-black tracking-[.35em] outline-none focus:border-[#183a60]"
              data-testid="input-admin-modal-password"
            />
            {passwordError && <p className="mt-2 text-xs font-bold text-[#b85c59]" data-testid="status-admin-modal-password-error">비밀번호를 다시 확인해 주세요.</p>}
            <button onClick={openAdmin} disabled={password.length !== 4} className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#183a60] px-4 py-3 text-sm font-extrabold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35" data-testid="button-admin-modal-unlock">
              관리자 화면 열기 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LandingPage() {
  const [, navigate] = useLocation();
  const result = readResult();
  const start = () => navigate('/quiz');
  return (
    <Shell>
      <div className="booth-shell px-5 pb-8 pt-3 md:px-8 md:pt-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#183a60]/12 bg-white px-6 pb-9 pt-8 text-[#183a60] md:px-14 md:pb-14 md:pt-14">
          <div className="relative max-w-2xl">
            <h1 className="max-w-[700px] font-serif text-[2.45rem] font-bold leading-[1.18] tracking-[-.08em] md:text-6xl">
              모두가 평등하고 존엄한 인간,<br /><span className="slogan-accent">함께하는 인권도시 부산</span>
            </h1>
            <p className="mt-6 max-w-[540px] text-[15px] leading-7 text-[#183a60]/70">3분 인권 OX 퀴즈로 우리 곁의 권리를 발견해 보세요. 다 풀고 나면 럭키드로우에도 도전할 수 있어요.</p>
            {result ? (
              <div className="mt-8 space-y-3 md:w-[310px]">
                <div className="rounded-2xl border-2 border-[#d8796f] bg-white/35 px-5 py-4 text-sm font-extrabold text-[#b85c59]" data-testid="status-already-participated">이미 참여하셨습니다!</div>
                <button onClick={() => navigate('/result')} className="focus-ring flex w-full items-center justify-between rounded-2xl border-2 border-[#294558]/25 px-5 py-4 text-left text-sm font-extrabold text-[#294558] transition-colors hover:bg-white/35" data-testid="button-view-result">
                  결과 확인하기 <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <button onClick={start} className="focus-ring mt-8 flex w-full items-center justify-between rounded-2xl bg-[#e98275] px-5 py-4 text-left font-extrabold text-white transition-transform hover:-translate-y-1 active:translate-y-1 md:w-[360px]" data-testid="button-start-quiz">
                인권 OX 퀴즈 풀기 <ArrowRight size={20} />
              </button>
            )}
          </div>
          <div className="relative mt-12 flex flex-wrap gap-2 text-xs font-bold text-[#294558]/75">
            <span className="flex items-center gap-1.5 rounded-full border border-[#183a60]/15 px-3 py-2"><Clock3 size={14} /> 약 3분</span>
            <span className="flex items-center gap-1.5 rounded-full border border-[#183a60]/15 px-3 py-2"><CircleHelp size={14} /> 5문항</span>
          </div>
        </section>

        <section className="pb-16 pt-16 md:pb-24 md:pt-24">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold tracking-[.16em] text-[#d8796f]">부산광역시인권센터</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-[-.08em]">모두의 일상에<br />인권이 가까워지도록.</h2>
            <p className="mt-4 text-sm leading-7 text-[#294558]/65">부산광역시인권센터는 누구나 존중받는 부산을 만들기 위해 상담과 교육, 정책과 문화 활동을 이어갑니다.</p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {[
              ['옹호', '옹호 사업', '인권침해 상담과 무료 법률상담을 지원하고, 유관기관과 연계한 든든한 지원 네트워크와 교류 사업을 펼치고 있어요.'],
              ['정책', '정책 사업', '시민인권모니터단을 운영하며, 부산시의 인권 현안과 실태를 꼼꼼히 조사하고 더 나은 정책을 연구하고 있답니다.'],
              ['교육', '교육 사업', '시민분들을 직접 찾아가는 인권교육은 물론, 부산의 지방공사·공단과 출연출자기관의 인권경영선언 추진까지 돕고 있어요.'],
              ['문화', '문화 사업', '부산인권주간과 세계인권선언의 날 기념행사를 열고, 인권공모전 개최와 뉴스레터 발간으로 다채로운 인권 문화를 만들어가고 있어요.'],
            ].map(([label, title, description], index) => {
              const ServiceIcon = [HandHeart, Scale, GraduationCap, Megaphone][index];
              return (
              <article key={title} className="rounded-3xl border border-[#183a60]/12 bg-white p-6">
                <div className="flex items-center gap-3 text-[#183a60]">
                  <ServiceIcon size={21} strokeWidth={1.8} aria-hidden="true" />
                  <span className="text-xs font-extrabold tracking-[.12em] text-[#d8796f]">{label}</span>
                </div>
                <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#29415b]/65">{description}</p>
              </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border-2 border-dashed border-[#183a60]/25 px-6 py-7 md:flex md:items-center md:justify-between md:px-8">
          <div>
            <div className="flex items-center gap-2 text-[#e8003d]"><Mail size={17} /><span className="text-xs font-extrabold tracking-[.12em]">센터 소식</span></div>
            <h2 className="mt-2 text-lg font-extrabold">생활 속 인권 이야기를 더 받아볼까요?</h2>
            <p className="mt-1 text-sm text-[#183a60]/60">부산광역시인권센터의 새 소식과 프로그램을 전해드려요.</p>
          </div>
          <div className="mt-5 flex w-full flex-col gap-2 md:mt-0 md:w-auto">
            <a href="https://www.instagram.com/bs_humanrights/" target="_blank" rel="noreferrer" className="focus-ring flex items-center justify-center gap-2 rounded-xl border-2 border-[#e98275] px-4 py-3 text-sm font-extrabold text-[#d8796f] transition-colors hover:bg-[#e98275] hover:text-white" data-testid="button-instagram">
              <Instagram size={16} /> 인스타그램 구독하기 <ChevronRight size={16} />
            </a>
            <a href="https://busanhumanrights.or.kr/etc/sub1.php" target="_blank" rel="noreferrer" onClick={() => localStorage.setItem(NEWSLETTER_KEY, 'yes')} className="focus-ring flex items-center justify-center gap-2 rounded-xl border-2 border-[#183a60] px-4 py-3 text-sm font-extrabold transition-colors hover:bg-[#183a60] hover:text-[#f6f1e8]" data-testid="button-newsletter">
              <><Mail size={16} /> 뉴스레터 구독하러 가기 <ChevronRight size={16} /></>
            </a>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function QuizPage() {
  const [, navigate] = useLocation();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [result] = useState(readResult);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selected, setSelected] = useState<QuizAnswer | null>(null);
  const [remaining, setRemaining] = useState(0);
  const question = questions?.[current];
  const answered = selected !== null;
  const correct = selected === question?.answer;

  useEffect(() => {
    if (result) navigate('/result');
  }, [result, navigate]);

  useEffect(() => {
    const syncQuestions = () => setQuestions(readQuestions());
    window.addEventListener(QUESTIONS_UPDATED_EVENT, syncQuestions);
    fetchRemoteQuestions().then(remoteQuestions => setQuestions(remoteQuestions ?? readQuestions()));
    return () => window.removeEventListener(QUESTIONS_UPDATED_EVENT, syncQuestions);
  }, []);

  useEffect(() => {
    if (!answered) return;
    setRemaining(2);
    const timer = window.setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [answered, current]);

  const choose = (answer: QuizAnswer) => {
    if (answered) return;
    setSelected(answer);
    setAnswers(values => [...values, answer]);
  };
  const next = () => {
    if (remaining > 0) return;
    if (!questions) return;
    if (current === questions.length - 1) {
      const finalAnswers = answers;
      const score = Math.round(finalAnswers.filter((value, index) => value === questions[index].answer).length / questions.length * 100);
      const stored: StoredResult = { score, answers: finalAnswers, finishedAt: new Date().toISOString(), verified: false, luckyUnlocked: false };
      localStorage.setItem(RESULT_KEY, JSON.stringify(stored));
      navigate('/result');
      return;
    }
    setCurrent(value => value + 1);
    setSelected(null);
  };

  if (!questions || !question) {
    return <Shell><div className="px-5 py-24 text-center text-sm font-bold text-[#183a60]/60">문항을 불러오는 중이에요.</div></Shell>;
  }
  return (
    <Shell>
      <div className="booth-shell px-5 pb-10 pt-5 md:px-8 md:pt-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="focus-ring flex items-center gap-1 text-sm font-bold text-[#183a60]/60" data-testid="link-quiz-back"><ArrowLeft size={17} /> 처음으로</Link>
          <span className="text-xs font-extrabold text-[#183a60]/55" data-testid="text-progress">{String(current + 1).padStart(2, '0')} / 05</span>
        </div>
        <div className="mt-5 h-2 rounded-full bg-[#183a60]/10"><div className="h-full rounded-full bg-[#e8003d] transition-all duration-500" style={{ width: `${((current + 1) / 5) * 100}%` }} /></div>
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-[.16em] text-[#e8003d]"><span className="h-2 w-2 rounded-full bg-[#e8003d]" /> 오늘의 인권 한 문장</div>
          <h1 className="mt-5 font-serif text-[2rem] font-bold leading-[1.35] tracking-[-.07em] md:text-4xl" data-testid={`text-question-${question.id}`}>{question.statement}</h1>
          <p className="mt-4 text-sm text-[#183a60]/55">이 문장이 맞다고 생각하면 O, 아니라면 X를 눌러주세요.</p>
          <div className="mt-10 grid grid-cols-2 gap-3 md:gap-5">
            {(['O', 'X'] as QuizAnswer[]).map(value => {
              const isSelected = selected === value;
              const isRight = answered && value === question.answer;
              const isWrong = answered && isSelected && !correct;
              return (
                <button key={value} onClick={() => choose(value)} disabled={answered} className={`focus-ring relative flex aspect-[1.12] items-center justify-center rounded-3xl border-2 text-7xl font-black transition-transform duration-200 md:text-8xl ${isRight ? 'border-[#138a63] bg-[#c6eedc] text-[#08704e] stamp-in' : isWrong ? 'border-[#e8003d] bg-[#ffd5df] text-[#b60032]' : isSelected ? 'border-[#183a60] bg-[#183a60] text-white' : 'border-[#183a60]/15 bg-[#fffdf8] text-[#183a60] hover:-translate-y-1 hover:border-[#e8003d] hover:text-[#e8003d]'}`} data-testid={`button-answer-${value}`}>
                  {value}
                  {isRight && <span className="absolute right-3 top-3 rounded-full bg-[#138a63] p-1 text-white"><Check size={15} /></span>}
                  {isWrong && <span className="absolute right-3 top-3 rounded-full bg-[#e8003d] p-1 text-white"><X size={15} /></span>}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className={`mt-6 rounded-2xl border-l-4 p-5 rise-in ${correct ? 'border-[#138a63] bg-[#e3f7ed]' : 'border-[#e8003d] bg-[#ffe8ed]'}`} data-testid="status-answer-feedback">
              <div className={`flex items-center gap-2 text-sm font-black ${correct ? 'text-[#08704e]' : 'text-[#b60032]'}`}>{correct ? <Check size={18} /> : <X size={18} />} {correct ? '정답이에요' : '아쉬워요'}</div>
              <p className="mt-2 text-sm leading-6 text-[#183a60]/80">{question.explanation}</p>
              <button onClick={next} disabled={remaining > 0} className="focus-ring mt-4 flex w-full items-center justify-between rounded-xl bg-[#183a60] px-4 py-3 text-sm font-extrabold text-[#f6f1e8] transition-opacity disabled:cursor-wait disabled:opacity-55" data-testid="button-next-question">
                {current === questions.length - 1 ? '결과 확인하기' : remaining > 0 ? `${remaining}초 후 다음 문항` : '다음 문항'} <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function ResultPage() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<StoredResult | null>(readResult);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  if (!result) {
    return <Shell><div className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="font-serif text-3xl font-bold">아직 퀴즈를 풀지 않았어요.</h1><Link href="/quiz" className="focus-ring mt-6 inline-flex rounded-xl bg-[#e8003d] px-5 py-3 text-sm font-bold text-white" data-testid="link-go-quiz">퀴즈 풀러 가기</Link></div></Shell>;
  }
  const verify = () => {
    if (pin === ACCESS_PASSWORD) {
      const updated = { ...result, verified: true, luckyUnlocked: true };
      localStorage.setItem(RESULT_KEY, JSON.stringify(updated));
      setResult(updated);
      setPinError(false);
    } else setPinError(true);
  };
  return (
    <Shell>
      <div className="booth-shell px-5 pb-12 pt-5 md:px-8 md:pt-10">
        <div className="mx-auto max-w-xl">
          <Link href="/" className="focus-ring flex w-fit items-center gap-1 text-sm font-bold text-[#183a60]/60" data-testid="link-result-home"><ArrowLeft size={17} /> 처음으로</Link>
          <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#183a60]/12 bg-white px-6 py-8 text-[#183a60] md:px-10 md:py-10">
            <p className="text-xs font-extrabold tracking-[.16em] text-[#d8796f]">퀴즈 완료</p>
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-[-.08em]">오늘의 인권 감각,<br />잘 확인했어요.</h1>
            <div className="mt-9 flex items-end gap-3">
              <strong className="font-serif text-8xl leading-none text-[#183a60]" data-testid="text-score">{result.score}</strong><span className="pb-2 text-lg font-bold text-[#183a60]/60">점</span>
            </div>
            <p className="mt-4 text-base font-extrabold" data-testid="text-score-summary">총 100점 중 {result.score}점입니다!</p>
            <p className="mt-5 text-sm leading-6 text-[#183a60]/65">{result.score >= 80 ? '인권을 바라보는 눈이 아주 따뜻하네요.' : '정답보다 중요한 건, 오늘 한 번 더 생각해 본 마음이에요.'}</p>
          </section>

          <section className="ticket-notch relative mt-10 rounded-2xl border border-[#183a60]/12 bg-white p-6" data-testid="section-staff-verification">
            {result.luckyUnlocked ? (
              <div className="stamp-in">
                <div className="flex items-center gap-2 text-[#138a63]"><ShieldCheck size={19} /><span className="text-sm font-black">스태프 확인 완료</span></div>
                <h2 className="mt-4 font-serif text-3xl font-bold tracking-[-.08em]">행운 추첨,<br />이제 참여할 수 있어요.</h2>
                <p className="mt-3 text-sm leading-6 text-[#183a60]/65">이 화면을 스태프에게 보여주고 추첨함에 넣어주세요. 오늘의 작은 배움이 행운으로 이어집니다.</p>
                <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#138a63]/25 px-4 py-3 text-sm font-extrabold text-[#08704e]"><Ticket size={18} /> 추첨 참여 가능</div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[#e8003d]"><LockKeyhole size={18} /><span className="text-xs font-extrabold tracking-[.12em]">스태프 확인 후 추첨 가능</span></div>
                <h2 className="mt-4 text-xl font-extrabold">스태프에게 이 화면을 보여주세요.</h2>
                <p className="mt-2 text-sm leading-6 text-[#183a60]/60">스태프가 확인한 4자리 인증번호를 입력하면 행운 추첨이 열립니다.</p>
                <div className="mt-5 flex gap-2">
                  <input value={pin} onChange={event => { setPin(event.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false); }} inputMode="numeric" placeholder="4자리 번호" className="focus-ring min-w-0 flex-1 rounded-xl border-2 border-[#183a60]/15 bg-[#f6f1e8] px-4 py-3 text-center text-lg font-black tracking-[.35em] outline-none focus:border-[#e8003d]" data-testid="input-staff-pin" />
                  <button onClick={verify} disabled={pin.length !== 4} className="focus-ring rounded-xl bg-[#e8003d] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-35" data-testid="button-verify-pin">확인</button>
                </div>
                {pinError && <p className="mt-2 text-xs font-bold text-[#e8003d]" data-testid="status-pin-error">인증번호를 다시 확인해 주세요.</p>}
              </>
            )}
          </section>

          <section className="mt-10 rounded-2xl border border-[#183a60]/12 bg-white p-6">
            <div className="flex items-center gap-2 text-[#183a60]"><Mail size={18} /><span className="text-xs font-extrabold tracking-[.12em]">센터 소식</span></div>
            <h2 className="mt-3 text-lg font-extrabold">다음 인권 이야기도 만나보세요.</h2>
            <p className="mt-2 text-sm leading-6 text-[#183a60]/70">부산광역시인권센터의 프로그램과 생활 속 인권 소식을 보내드려요.</p>
            <div className="mt-5 flex flex-col gap-2">
              <a href="https://www.instagram.com/bs_humanrights/" target="_blank" rel="noreferrer" className="focus-ring flex items-center gap-2 rounded-xl border-2 border-[#e98275] px-4 py-3 text-sm font-extrabold text-[#d8796f] transition-colors hover:bg-[#e98275] hover:text-white" data-testid="button-result-instagram"><Instagram size={16} /> 인스타그램 구독하기 <ChevronRight size={16} /></a>
              <a href="https://busanhumanrights.or.kr/etc/sub1.php" target="_blank" rel="noreferrer" onClick={() => localStorage.setItem(NEWSLETTER_KEY, 'yes')} className="focus-ring flex items-center gap-2 rounded-xl bg-[#183a60] px-4 py-3 text-sm font-extrabold text-[#f6f1e8]" data-testid="button-result-newsletter"><Mail size={16} /> 뉴스레터 구독하러 가기 <ChevronRight size={16} /></a>
            </div>
          </section>
          <button onClick={() => { localStorage.removeItem(RESULT_KEY); navigate('/'); }} className="focus-ring mx-auto mt-8 flex items-center gap-1.5 text-[10px] font-medium text-[#183a60]/20 opacity-70 transition-opacity hover:text-[#183a60]/45 hover:opacity-100" data-testid="button-reset-participation"><RotateCcw size={12} /> 기기 기록 초기화</button>
        </div>
      </div>
    </Shell>
  );
}

function AdminPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>(readQuestions);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'yes');
  const update = (id: number, key: keyof QuizQuestion, value: string) => setQuestions(values => values.map(question => question.id === id ? { ...question, [key]: value } as QuizQuestion : question));
  useEffect(() => {
    fetchRemoteQuestions().then(async remoteQuestions => {
      if (remoteQuestions) {
        setQuestions(remoteQuestions);
        localStorage.setItem(QUESTIONS_KEY, JSON.stringify(remoteQuestions));
        return;
      }
      const localQuestions = readQuestions();
      const hasCustomLocalQuestions = localStorage.getItem(QUESTIONS_KEY) !== null;
      setQuestions(localQuestions);
      if (hasCustomLocalQuestions) {
        await saveRemoteQuestions(localQuestions);
      }
    });
  }, []);
  const save = async () => {
    setSaving(true);
    setSaveError(false);
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
    const remoteSaved = await saveRemoteQuestions(questions);
    window.dispatchEvent(new Event(QUESTIONS_UPDATED_EVENT));
    setSaving(false);
    if (!remoteSaved) {
      setSaveError(true);
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  const reset = async () => {
    setSaveError(false);
    setQuestions(defaultQuestions);
    localStorage.removeItem(QUESTIONS_KEY);
    const remoteReset = await resetRemoteQuestions();
    window.dispatchEvent(new Event(QUESTIONS_UPDATED_EVENT));
    if (!remoteReset) setSaveError(true);
  };
  const unlock = () => {
    if (password === ACCESS_PASSWORD) {
      setUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };
  if (!unlocked) {
    return (
      <Shell>
        <div className="booth-shell px-5 pb-12 pt-12 md:px-8 md:pt-20">
          <div className="mx-auto max-w-md rounded-3xl border border-[#183a60]/12 bg-white p-7 md:p-9">
            <Link href="/" className="focus-ring flex w-fit items-center gap-1 text-sm font-bold text-[#183a60]/60" data-testid="link-admin-lock-home"><ArrowLeft size={17} /> 처음으로</Link>
            <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#183a60]/12 text-[#183a60]"><LockKeyhole size={22} /></div>
            <p className="mt-7 text-xs font-extrabold tracking-[.16em] text-[#d8796f]">운영자 전용</p>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-[-.08em]">관리자 비밀번호를<br />입력해 주세요.</h1>
            <p className="mt-4 text-sm leading-6 text-[#183a60]/60">문항을 수정하려면 운영자 비밀번호가 필요합니다.</p>
            <input value={password} onChange={event => { setPassword(event.target.value.replace(/\D/g, '').slice(0, 4)); setPasswordError(false); }} onKeyDown={event => { if (event.key === 'Enter') unlock(); }} inputMode="numeric" maxLength={4} placeholder="4자리 비밀번호" className="focus-ring mt-7 w-full rounded-xl border-2 border-[#183a60]/15 bg-white px-4 py-3 text-center text-lg font-black tracking-[.35em] outline-none focus:border-[#183a60]" data-testid="input-admin-password" />
            <button onClick={unlock} disabled={password.length !== 4} className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#183a60] px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-admin-unlock"><LockKeyhole size={16} /> 관리자 화면 열기</button>
            {passwordError && <p className="mt-3 text-center text-xs font-bold text-[#b45265]" data-testid="status-admin-password-error">비밀번호를 다시 확인해 주세요.</p>}
          </div>
        </div>
      </Shell>
    );
  }
  return (
    <Shell>
      <div className="booth-shell px-5 pb-12 pt-5 md:px-8 md:pt-10">
        <div className="flex items-start justify-between gap-4">
           <div><Link href="/" className="focus-ring flex w-fit items-center gap-1 text-sm font-bold text-[#183a60]/60" data-testid="link-admin-home"><ArrowLeft size={17} /> 처음으로</Link><p className="mt-8 text-xs font-extrabold tracking-[.16em] text-[#d8796f]">운영자 편집</p><h1 className="mt-2 font-serif text-4xl font-bold tracking-[-.08em]">퀴즈 문항<br />관리하기</h1><p className="mt-4 max-w-md text-sm leading-6 text-[#183a60]/60">문항과 해설을 저장하면 모든 방문자의 퀴즈에 바로 반영돼요.</p></div>
          <div className="hidden rounded-2xl border border-[#183a60]/12 p-4 text-[#183a60] md:block"><Pencil size={22} /></div>
        </div>
        <div className="mt-10 space-y-4">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-2xl border border-[#183a60]/15 bg-white p-5 md:p-6" data-testid={`card-question-${question.id}`}>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-black text-[#e8003d]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8003d] text-white">{String(index + 1).padStart(2, '0')}</span> 문항</span><span className="text-xs font-bold text-[#183a60]/45">정답: {question.answer}</span></div>
              <label className="mt-5 block text-xs font-extrabold text-[#183a60]/55">문장</label>
              <textarea value={question.statement} onChange={event => update(question.id, 'statement', event.target.value)} className="focus-ring mt-2 min-h-20 w-full resize-y rounded-xl border border-[#183a60]/15 bg-white p-3 text-sm font-bold leading-6 outline-none focus:border-[#e8003d]" data-testid={`input-statement-${question.id}`} />
              <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
                <div><span className="block text-xs font-extrabold text-[#183a60]/55">정답</span><div className="mt-2 flex gap-2">{(['O', 'X'] as QuizAnswer[]).map(answer => <button key={answer} onClick={() => update(question.id, 'answer', answer)} className={`focus-ring flex h-11 w-14 items-center justify-center rounded-xl border-2 text-lg font-black ${question.answer === answer ? 'border-[#183a60] bg-[#183a60] text-white' : 'border-[#183a60]/15 text-[#183a60]/45'}`} data-testid={`button-answer-${question.id}-${answer}`}>{answer}</button>)}</div></div>
                <div><label className="block text-xs font-extrabold text-[#183a60]/55">해설</label><textarea value={question.explanation} onChange={event => update(question.id, 'explanation', event.target.value)} className="focus-ring mt-2 min-h-20 w-full resize-y rounded-xl border border-[#183a60]/15 bg-white p-3 text-sm leading-6 outline-none focus:border-[#e8003d]" data-testid={`input-explanation-${question.id}`} /></div>
              </div>
            </article>
          ))}
        </div>
           <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-[#183a60]/15 bg-white/95 p-3 shadow-[0_8px_25px_rgba(24,58,96,.12)] backdrop-blur">
          <button onClick={reset} className="focus-ring flex items-center gap-1.5 rounded-xl px-3 py-3 text-xs font-bold text-[#183a60]/60 hover:bg-[#183a60]/10" data-testid="button-reset-questions"><RotateCcw size={15} /> 기본값 복원</button>
           <div className="flex items-center gap-3">
             {saveError && <span className="text-xs font-bold text-[#b45265]">서버 저장에 실패했어요.</span>}
             <button onClick={save} disabled={saving} className="focus-ring flex items-center gap-2 rounded-xl bg-[#e8003d] px-5 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_#9d002b] active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-60" data-testid="button-save-questions"><Save size={16} /> {saving ? '저장 중…' : saved ? '저장했어요' : '변경사항 저장'}</button>
           </div>
        </div>
      </div>
    </Shell>
  );
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={LandingPage} /><Route path="/quiz" component={QuizPage} /><Route path="/result" component={ResultPage} /><Route path="/admin" component={AdminPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

const queryClient = new QueryClient();
function App() {
  useEffect(() => {
    fetchRemoteQuestions().then(async remoteQuestions => {
      if (remoteQuestions) return;
      const localQuestions = readQuestions();
      if (localStorage.getItem(QUESTIONS_KEY) !== null) {
        await saveRemoteQuestions(localQuestions);
      }
    });
  }, []);

  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;