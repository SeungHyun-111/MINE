import { useState } from 'react'
import {
  Bot,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Code2,
  FileCode2,
  FolderGit2,
  GitBranch,
  Image,
  Link2,
  Network,
  Package,
  Play,
  Save,
  Search,
  Terminal,
  Workflow,
  XCircle,
} from 'lucide-react'

const setupFiles = ['프로젝트목록.md', '개발규칙.md', '아이디어.md', '회의.md', 'TODO.md']
const excludedFolders = ['node_modules', 'dist', 'build', '.git', '.cache', 'coverage']
const roles = [
  ['pnpm', '프로젝트 및 패키지 관리'],
  ['VS Code', '코드 작성'],
  ['Git/GitHub', '버전 관리'],
  ['Obsidian', '프로젝트 지식 관리'],
  ['ChatGPT/Claude', '문서 작성 및 AI 보조'],
]
const comfyNodes = ['Checkpoint Loader', 'Text Encode', 'KSampler', 'VAE Decode', 'Save Image']
const comfyCustomNodes = ['Impact Pack', 'ControlNet', 'IPAdapter', 'Florence2', 'Reactor']
const comfyRequirements = ['모델(SDXL, Flux 등)', 'LoRA', 'VAE', 'ControlNet', '커스텀 노드']
const installResults = [
  ['GitHub Clone', true],
  ['Python', true],
  ['pip', true],
  ['PyPI', true],
  ['Intel Arc(XPU)', true],
  ['ComfyUI 실행', true],
  ['ComfyUI Desktop', false],
]

function Section({ number, title, children }) {
  return (
    <section className="border-t border-[#d6e4f8] py-8 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#0044cc] text-sm font-black text-white">
          {number}
        </span>
        <h2 className="text-xl font-black text-[#133b7a]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Card({ icon: Icon, title, text, items }) {
  return (
    <div className="rounded-lg border border-[#c4d8f4] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded bg-[#eef5ff] text-[#0044cc]">
          <Icon size={21} />
        </span>
        <h3 className="text-base font-black text-[#133b7a]">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-slate-600">{text}</p>
      {items ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22a06b]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function CodeBlock({ children }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-[#bfd3ef] bg-[#10233f] p-4 text-sm leading-7 text-[#e8f1ff]">
      <code>{children}</code>
    </pre>
  )
}

function FlowCard({ icon: Icon, title, text }) {
  return (
    <div className="flex min-h-28 flex-col justify-center rounded-lg border border-[#c8daf2] bg-white px-4 py-3 shadow-sm">
      <Icon className="mb-2 text-[#0044cc]" size={22} />
      <strong className="text-sm font-black text-[#133b7a]">{title}</strong>
      <span className="mt-1 text-xs leading-5 text-slate-600">{text}</span>
    </div>
  )
}

function ArrowFlow({ items, tone = 'blue' }) {
  const colors = tone === 'green'
    ? 'border-[#bfe3d2] bg-[#f4fff8] text-[#146c43]'
    : 'border-[#c8daf2] bg-[#f7fbff] text-[#264f91]'

  return (
    <div className="grid gap-2 md:grid-cols-5">
      {items.map((item, index) => (
        <div key={item} className="flex items-center gap-2 md:block">
          <div className={`flex min-h-20 flex-1 items-center justify-center rounded-lg border px-3 text-center text-sm font-black ${colors}`}>
            {item}
          </div>
          {index < items.length - 1 ? <span className="text-xl font-black text-[#7799cc] md:hidden">→</span> : null}
        </div>
      ))}
    </div>
  )
}

function SetupTab() {
  return (
    <>
      <div className="mb-8 grid gap-3 md:grid-cols-4">
        <FlowCard icon={Code2} title="프로젝트" text="pnpm 기반 앱과 도구를 CODEX 아래에 모읍니다." />
        <FlowCard icon={FileCode2} title="Obsidian" text="Markdown 문서와 아이디어를 링크로 연결합니다." />
        <FlowCard icon={GitBranch} title="Git" text="코드와 문서의 변경 이력을 남깁니다." />
        <FlowCard icon={Bot} title="AI" text="회의록 요약, 문서 초안, 정리를 보조합니다." />
      </div>

      <div className="rounded-lg border border-[#bfd3ef] bg-white px-5 py-7 shadow-sm md:px-8">
        <Section number="1" title="pnpm 역할">
          <div className="grid gap-4 md:grid-cols-2">
            <Card icon={Package} title="패키지 관리자" text="pnpm은 프로젝트를 정리하는 프로그램이 아니라 패키지 관리자입니다." items={['node_modules 중복 제거', '디스크 용량 절약', '설치 속도 향상', 'Workspace로 여러 프로젝트 관리']} />
            <CodeBlock>{`CODEX
|-- schedule-viewer
|-- weighted-minute-web
|-- block-choi
|-- prePGM
|-- pnpm-workspace.yaml`}</CodeBlock>
          </div>
        </Section>

        <Section number="2" title="Obsidian 역할">
          <p className="mb-4 text-sm leading-7 text-slate-600">
            Obsidian은 Markdown 파일을 관리하고 서로 연결하는 프로그램입니다. 노트 하나는 md 파일 하나이고,
            모든 문서는 실제 컴퓨터에 저장되는 일반 Markdown 파일입니다.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {setupFiles.map((file) => (
              <div key={file} className="rounded border border-[#d6e4f8] bg-[#f7fbff] px-3 py-3 text-sm font-bold text-[#264f91]">
                {file}
              </div>
            ))}
          </div>
        </Section>

        <Section number="3" title="노트 링크가 핵심">
          <div className="grid gap-4 md:grid-cols-2">
            <CodeBlock>{`# 가중분 웹앱

관련 프로젝트

[[편성뷰어]]
[[PDF 내보내기]]
[[성능 개선]]
[[아이디어]]`}</CodeBlock>
            <div className="grid content-center gap-3 rounded-lg bg-[#f7fbff] p-4">
              <div className="rounded bg-[#0044cc] px-4 py-3 text-center text-sm font-black text-white">가중분 웹앱</div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm font-bold text-[#264f91]">
                <div className="rounded border border-[#c8daf2] bg-white px-2 py-4">편성뷰어</div>
                <div className="rounded border border-[#c8daf2] bg-white px-2 py-4">PDF</div>
                <div className="rounded border border-[#c8daf2] bg-white px-2 py-4">성능개선</div>
              </div>
            </div>
          </div>
        </Section>

        <Section number="4" title="추천 폴더 구조">
          <CodeBlock>{`CODEX
|-- schedule-viewer
|-- weighted-minute-web
|-- block-choi
|-- prePGM
|
|-- 프로젝트목록.md
|-- 개발규칙.md
|-- 아이디어.md
|-- 회의.md
|-- TODO.md`}</CodeBlock>
        </Section>

        <Section number="5" title="Obsidian Vault와 제외 폴더">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card icon={FolderGit2} title="Vault는 CODEX 하나만 지정" text="상위 폴더 하나만 Vault로 지정하면 README, 설계문서, 개발일지, 회의록, 아이디어를 하나의 공간에서 검색하고 연결할 수 있습니다." />
            <div className="grid gap-2 sm:grid-cols-2">
              {excludedFolders.map((folder) => (
                <div key={folder} className="flex items-center gap-2 rounded border border-[#d6e4f8] bg-[#f7fbff] px-3 py-3 text-sm font-bold text-[#264f91]">
                  <Search size={16} />
                  {folder}
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section number="6" title="최종 목표">
          <div className="grid gap-3 md:grid-cols-5">
            {roles.map(([tool, role]) => (
              <div key={tool} className="rounded-lg border border-[#c8daf2] bg-[#f7fbff] p-4">
                <strong className="block text-sm font-black text-[#0044cc]">{tool}</strong>
                <span className="mt-2 block text-xs leading-5 text-slate-600">{role}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  )
}

function ComfyOverview() {
  return (
    <>
      <div className="mb-8 grid gap-3 md:grid-cols-4">
        <FlowCard icon={Workflow} title="ComfyUI" text="AI 작업을 노드로 연결해 실행하는 워크플로우 프로그램입니다." />
        <FlowCard icon={Play} title="브라우저 실행" text="화면은 웹브라우저지만 처리는 내 PC의 GPU에서 이루어집니다." />
        <FlowCard icon={Save} title="JSON 저장" text="노드 연결과 설정값을 워크플로우 JSON으로 저장합니다." />
        <FlowCard icon={GitBranch} title="Git 관리" text="워크플로우 변경 이력을 GitHub에 남기기 좋습니다." />
      </div>

      <div className="rounded-lg border border-[#bfd3ef] bg-white px-5 py-7 shadow-sm md:px-8">
        <Section number="1" title="ComfyUI란?">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <Card icon={BrainCircuit} title="AI를 위한 비주얼 프로그래밍 도구" text="ComfyUI는 AI 작업을 노드로 연결하여 실행하는 워크플로우 프로그램입니다. 직접 개발하는 앱이라기보다 설치해서 사용하는 도구입니다." />
            <ArrowFlow items={['설치', '실행', '브라우저 접속', '노드 연결', 'Queue Prompt']} />
          </div>
        </Section>

        <Section number="2" title="기본 노드 흐름">
          <p className="mb-4 text-sm leading-7 text-slate-600">
            필요한 기능을 노드로 추가하고 선으로 연결합니다. 마지막에 Queue Prompt를 누르면 연결된 순서대로 실행됩니다.
          </p>
          <ArrowFlow items={comfyNodes} tone="green" />
        </Section>

        <Section number="3" title="노드와 워크플로우">
          <div className="grid gap-4 md:grid-cols-2">
            <Card icon={Boxes} title="노드(Node)" text="노드는 각각 하나의 기능입니다. React 컴포넌트처럼 필요한 것만 조합해서 사용합니다." items={['모델 불러오기', '프롬프트 입력', '이미지 생성', '업스케일', '배경제거', '얼굴 보정', '저장']} />
            <Card icon={Workflow} title="워크플로우(Workflow)" text="노드를 연결한 결과가 워크플로우입니다. 상품사진, 썸네일, OCR처럼 작업 단위로 저장할 수 있습니다." items={['Prompt', '이미지 생성', '배경제거', '업스케일', '워터마크', '저장']} />
          </div>
        </Section>

        <Section number="4" title="커스텀 노드">
          <p className="mb-4 text-sm leading-7 text-slate-600">
            대부분의 노드는 이미 만들어져 있습니다. 필요한 기능만 설치해서 쓰고, Python을 사용할 수 있다면 직접 커스텀 노드를 개발할 수도 있습니다.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {comfyCustomNodes.map((node) => (
              <div key={node} className="rounded border border-[#bfe3d2] bg-[#f4fff8] px-3 py-3 text-center text-sm font-black text-[#146c43]">
                {node}
              </div>
            ))}
          </div>
        </Section>

        <Section number="5" title="GitHub 관리 구조">
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock>{`AI_WORKFLOW
|-- workflows
|   |-- 상품사진.json
|   |-- 썸네일.json
|   |-- OCR.json
|
|-- prompts
|-- assets
|-- README.md`}</CodeBlock>
            <div className="rounded-lg bg-[#f7fbff] p-5">
              <h3 className="mb-4 text-base font-black text-[#133b7a]">버전 관리 흐름</h3>
              <ArrowFlow items={['v1 상품사진', 'v2 배경제거', 'v3 업스케일', 'v4 워터마크', '배포/공유']} />
            </div>
          </div>
        </Section>

        <Section number="6" title="다른 PC에서 사용">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card icon={GitBranch} title="불러오는 순서" text="다른 컴퓨터에서는 Git Clone 후 ComfyUI를 실행하고 Load Workflow에서 JSON 파일을 선택하면 동일한 워크플로우를 불러올 수 있습니다." items={['Git Clone', 'ComfyUI 실행', 'Load Workflow', '상품사진.json 선택']} />
            <Card icon={Package} title="주의사항" text="워크플로우 JSON만 같아도, 실행 환경이 다르면 똑같이 동작하지 않을 수 있습니다." items={comfyRequirements} />
          </div>
        </Section>

        <Section number="7" title="추천 프로젝트 구조">
          <CodeBlock>{`AI
|-- ComfyUI
|   |-- workflows
|   |-- prompts
|   |-- assets
|   |-- docs
|   |-- README.md
|
|-- React
|-- Python
|-- Automation`}</CodeBlock>
        </Section>

        <Section number="8" title="핵심 요약">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['ComfyUI', 'AI 워크플로우를 만드는 프로그램'],
              ['사용 방식', '설치 후 브라우저에서 노드 연결'],
              ['저장 방식', 'JSON 파일'],
              ['주의사항', '동일한 모델과 커스텀 노드 필요'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-[#c8daf2] bg-[#f7fbff] p-4">
                <strong className="block text-sm font-black text-[#0044cc]">{title}</strong>
                <span className="mt-2 block text-xs leading-5 text-slate-600">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-[#bfe3d2] bg-[#f4fff8] p-5">
            <div className="mb-2 flex items-center gap-2 text-[#146c43]">
              <Image size={19} />
              <strong className="text-sm font-black">한 줄 정리</strong>
            </div>
            <p className="text-sm leading-7 text-slate-700">
              ComfyUI는 설치형 AI 워크플로우 프로그램이며, 노드를 조합해 원하는 AI 작업을 만들고 이를 JSON으로 저장, 공유하며 Git으로 버전 관리하기에 매우 적합한 도구입니다.
            </p>
          </div>
        </Section>
      </div>
    </>
  )
}

function DirectInstallGuide() {
  return (
    <>
      <div className="mb-8 grid gap-3 md:grid-cols-4">
        <FlowCard icon={XCircle} title="Desktop 실패" text="Desktop 로그에서 SELF_SIGNED_CERT_IN_CHAIN 오류와 인스턴스 생성 실패를 확인했습니다." />
        <FlowCard icon={GitBranch} title="Git 직접 설치" text="Desktop을 쓰지 않고 GitHub에서 ComfyUI 소스를 직접 받았습니다." />
        <FlowCard icon={Terminal} title="Python 실행" text="requirements 설치 후 python main.py로 직접 실행했습니다." />
        <FlowCard icon={CheckCircle2} title="XPU Torch" text="Intel Arc 환경에 맞춰 XPU용 Torch로 교체했습니다." />
      </div>

      <div className="rounded-lg border border-[#bfd3ef] bg-white px-5 py-7 shadow-sm md:px-8">
        <Section number="1" title="이번 방식의 핵심">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <Card
              icon={Terminal}
              title="Desktop 우회가 아니라 직접 설치"
              text="이번에 한 방식은 ComfyUI Desktop을 우회한 것이 아니라, Desktop을 완전히 버리고 Git + Python 방식으로 직접 설치한 개발자 방식입니다."
            />
            <div className="rounded-lg border border-[#f3c6c6] bg-[#fff7f7] p-5">
              <h3 className="mb-3 text-base font-black text-[#a33a3a]">회사 환경에서 막힌 지점</h3>
              <div className="grid gap-2 text-sm">
                {[
                  ['GitHub', '가능', true],
                  ['PyPI', '가능', true],
                  ['Hugging Face', 'SSL 오류', false],
                  ['download.comfy.org', 'SSL 오류', false],
                  ['ComfyUI Desktop', '인스턴스 생성 실패', false],
                ].map(([name, status, ok]) => (
                  <div key={name} className="grid grid-cols-[1fr_120px] gap-3 rounded border border-white bg-white px-3 py-2">
                    <span className="font-bold text-slate-700">{name}</span>
                    <span className={ok ? 'font-black text-[#146c43]' : 'font-black text-[#b42318]'}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded bg-[#10233f] px-3 py-2 font-mono text-xs text-[#ffdede]">
                SELF_SIGNED_CERT_IN_CHAIN
              </p>
            </div>
          </div>
        </Section>

        <Section number="2" title="설치 위치와 다운로드">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              icon={XCircle}
              title="사용하지 않는 Desktop 경로"
              text="Desktop 설치 경로는 더 이상 사용하지 않습니다."
              items={['C:\\Users\\SK스토아\\AppData\\Local\\Comfy-Desktop']}
            />
            <CodeBlock>{`cd C:\
mkdir AI
cd AI

git clone https://github.com/Comfy-Org/ComfyUI.git`}</CodeBlock>
          </div>
          <p className="mt-4 rounded-lg border border-[#c8daf2] bg-[#f7fbff] px-4 py-3 text-sm font-bold text-[#264f91]">
            설치 위치: C:\AI\ComfyUI
          </p>
        </Section>

        <Section number="3" title="Python과 PyPI 확인">
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock>{`python --version
python -m pip --version

python -m pip index versions torch`}</CodeBlock>
            <Card
              icon={Package}
              title="PyPI 연결 확인"
              text="PyPI는 정상 연결되는 것을 확인했고, requirements 설치도 정상 완료되었습니다."
              items={['Python 확인', 'pip 확인', 'torch 패키지 조회', 'requirements.txt 설치']}
            />
          </div>
        </Section>

        <Section number="4" title="ComfyUI 의존성 설치와 첫 실행">
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock>{`python -m pip install -r requirements.txt

python main.py`}</CodeBlock>
            <div className="rounded-lg border border-[#f3c6c6] bg-[#fff7f7] p-5">
              <h3 className="mb-3 text-base font-black text-[#a33a3a]">첫 실행 오류</h3>
              <p className="rounded bg-[#10233f] px-3 py-2 font-mono text-xs leading-6 text-[#ffdede]">
                AssertionError:<br />
                Torch not compiled with CUDA enabled
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                원인은 회사 PC GPU가 Intel Arc인데, 기본 Torch가 NVIDIA CUDA 기준으로 설치되었기 때문입니다.
              </p>
            </div>
          </div>
        </Section>

        <Section number="5" title="Intel Arc(XPU)용 Torch 교체">
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock>{`python -m pip uninstall torch torchvision torchaudio -y

python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/xpu`}</CodeBlock>
            <Card
              icon={CheckCircle2}
              title="설치 완료"
              text="CUDA용 Torch를 제거하고 Intel Arc(XPU)용 Torch를 설치했습니다."
              items={['torch-2.13.0+xpu', 'torchvision-0.28.0+xpu', 'torchaudio-2.11.0+xpu']}
            />
          </div>
        </Section>

        <Section number="6" title="성공한 실행 방법">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <CodeBlock>{`cd C:\AI\ComfyUI

python main.py`}</CodeBlock>
            <Card
              icon={Play}
              title="브라우저 접속"
              text="실행 후 Starting server가 표시되면 브라우저에서 접속합니다. 앞으로도 Desktop은 실행하지 않습니다."
              items={['Starting server', 'http://127.0.0.1:8188', 'Desktop 실행 X']}
            />
          </div>
        </Section>

        <Section number="7" title="이번에 확인된 것">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {installResults.map(([label, ok]) => {
              const Icon = ok ? CheckCircle2 : XCircle
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-black ${
                    ok
                      ? 'border-[#bfe3d2] bg-[#f4fff8] text-[#146c43]'
                      : 'border-[#f3c6c6] bg-[#fff7f7] text-[#b42318]'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </div>
              )
            })}
          </div>
        </Section>

        <Section number="8" title="결론">
          <div className="rounded-lg border border-[#bfe3d2] bg-[#f4fff8] p-5">
            <p className="text-sm leading-7 text-slate-700">
              이번 방법은 ComfyUI Desktop의 설치와 업데이트 로직에 의존하지 않습니다. 회사 환경처럼 Desktop이 SSL이나 다운로드 문제로 실패해도,
              GitHub에서 ComfyUI를 직접 내려받고 Python 환경에서 실행하면 ComfyUI 자체를 사용할 수 있다는 것을 확인했습니다.
            </p>
          </div>
        </Section>
      </div>
    </>
  )
}

function ComfyTab() {
  return <ComfyOverview />
}

function DevEnvironmentPage() {
  const [activeTab, setActiveTab] = useState('setup')

  return (
    <div className="min-h-full bg-[#f0f5ff] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 rounded-lg border border-[#bfd3ef] bg-white px-6 py-7 shadow-sm md:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded bg-[#0044cc] text-white">
              <Network size={24} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#4477cc]">개발 환경과 AI 워크플로우</p>
              <h1 className="text-2xl font-black text-[#102a5c] md:text-4xl">코드, 문서, 아이디어, AI를 한곳에서 관리하기</h1>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            CODEX 폴더를 중심으로 개발 환경을 정리하고, ComfyUI 같은 AI 작업도 JSON 워크플로우와 Git으로 관리하는 방식입니다.
          </p>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-2 rounded-lg border border-[#bfd3ef] bg-white p-2 shadow-sm sm:grid-cols-3">
          {[
            ['setup', '환경 셋팅', Code2],
            ['comfy', 'ComfyUI', Workflow],
            ['comfy-install', '직접 설치', Terminal],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded px-3 text-sm font-black transition-colors ${
                activeTab === key
                  ? 'bg-[#0044cc] text-white'
                  : 'text-[#4477cc] hover:bg-[#f0f5ff]'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'setup' ? <SetupTab /> : null}
        {activeTab === 'comfy' ? <ComfyTab /> : null}
        {activeTab === 'comfy-install' ? <DirectInstallGuide /> : null}
      </div>
    </div>
  )
}

export default DevEnvironmentPage
