import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDownUp, BookOpen, ChevronLeft, ChevronRight, CircleHelp, CircleDot, Focus, Maximize, Minus, Orbit,
  Pause, Play, Plus, Ruler, Search, Sparkles, X,
} from 'lucide-react'
import { bodyById, catalog, moons, planets, sun, type Body } from './catalog'
import { Orrery } from './orrery'
import { BodyImage, PlanetView } from './planet-view'
import { saturnDiscPreview, starTexture } from './textures'
import './styles.css'

type View = 'planet' | 'system' | 'compare'
type Overlay = 'search' | 'about'

const systemObjects = [sun, ...planets]
const speedOptions = [-100, -10, -1, 1, 10, 100]
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })

function formatPeriod(days: number) {
  return days < 365 ? `${number.format(days)} days` : `${number.format(days / 365.25)} years`
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function Brand({ onClick }: { onClick: () => void }) {
  return <button className="brand" onClick={onClick} aria-label="COSMOS home">
    <span className="brand-mark"><Orbit size={24} strokeWidth={1.75} /></span>
    <span>COSMOS</span>
  </button>
}

function PlanetDetails({ body, view, onSelect, onFocus }: {
  body: Body
  view: View
  onSelect: (id: string) => void
  onFocus: () => void
}) {
  const order = planets.indexOf(body)
  const parent = body.parentId ? bodyById.get(body.parentId) : undefined
  const relatedMoons = moons.filter(moon => moon.parentId === body.id)
  const current = systemObjects.indexOf(parent ?? body)
  const previous = systemObjects[(current - 1 + systemObjects.length) % systemObjects.length]
  const next = systemObjects[(current + 1) % systemObjects.length]
  return <aside className="details" aria-label={`${body.name} details`}>
    <div className="details-top">
      <span className="eyebrow">{body.classification}</span>
      <div className="body-nav">
        <button className="icon-button" onClick={() => onSelect(previous.id)} aria-label={`Previous object, ${previous.name}`} title={previous.name}><ChevronLeft size={16} /></button>
        <button className="icon-button" onClick={() => onSelect(next.id)} aria-label={`Next object, ${next.name}`} title={next.name}><ChevronRight size={16} /></button>
      </div>
    </div>
    <div className="details-copy" key={body.id}>
      <h1>{body.name}</h1>
      <p className="designation">{parent ? `Moon of ${parent.name}` : order >= 0 ? `Planet ${String(order + 1).padStart(2, '0')} of 08` : 'Star of our solar system'}</p>
      <p className="description">{body.description}</p>
      <dl className="metrics">
        <div><dt>Mean diameter</dt><dd>{number.format(body.diameterKm)} <span>km</span></dd></div>
        {body.orbitPeriodDays !== undefined && <div><dt>Orbital period</dt><dd>{formatPeriod(body.orbitPeriodDays)}</dd></div>}
        <div><dt>{body.kind === 'star' ? 'Surface gravity' : 'Gravity'}</dt><dd>{number.format(body.gravity)} <span>m/s²</span></dd></div>
      </dl>
      <div className="discovery">
        <div className="discovery-heading"><Sparkles size={15} aria-hidden="true" /> Did you know?</div>
        <p>{body.fact}</p>
      </div>
      <div className="details-links">
        {view === 'system' && <button className="moon-button" onClick={onFocus}>Focus on {body.name}</button>}
        {view !== 'system' && relatedMoons.map(moon => <button className="moon-button" key={moon.id} onClick={() => onSelect(moon.id)}><Orbit size={14} /> {moon.name}</button>)}
        {parent && <button className="moon-button" onClick={() => onSelect(parent.id)}><Orbit size={14} /> {parent.name}</button>}
        <a href={body.source} target="_blank" rel="noreferrer" className="source-link" title={`${body.name} facts on NASA Science`}><BookOpen size={14} /> NASA facts</a>
      </div>
    </div>
  </aside>
}

function CompareView({ body, onBodyChange }: { body: Body; onBodyChange: (id: string) => void }) {
  const [referenceId, setReferenceId] = useState('earth')
  const reference = bodyById.get(referenceId) ?? planets[2]
  const maxDiameter = Math.max(body.diameterKm, reference.diameterKm)
  const ratio = body.diameterKm / reference.diameterKm
  const entries = [
    { body, label: 'First object', select: onBodyChange },
    { body: reference, label: 'Second object', select: setReferenceId },
  ]

  return <section className="comparison" aria-labelledby="compare-title">
    <div className="comparison-title">
      <h2 id="compare-title">Compare diameters</h2>
      <p>{body.name} is {number.format(ratio)}× the diameter of {reference.name}.</p>
    </div>
    <div className="comparison-worlds">
      {entries.map(entry => <div className="comparison-world" key={entry.label}>
        <div className="comparison-disc">
          <div style={{ width: `${entry.body.diameterKm / maxDiameter * 100}%` }}>
            {entry.body.id === 'saturn'
              ? <img className="body-image" src={saturnDiscPreview} alt="" />
              : <BodyImage body={entry.body} />}
          </div>
        </div>
        <select aria-label={entry.label} value={entry.body.id} onChange={event => entry.select(event.target.value)}>
          {catalog.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select>
        <span className="compare-number">{number.format(entry.body.diameterKm)} km</span>
      </div>)}
    </div>
    <p className="compare-note">Relative mean diameters, with rings excluded.</p>
  </section>
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => { dialog?.close() }
  }, [])
  return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={event => {
    event.preventDefault()
    onClose()
  }} onClick={event => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <div className="dialog-inner">
      <div className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button>
      </div>
      {children}
    </div>
  </dialog>
}

function SearchObjects({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  const matches = catalog.filter(item => `${item.name} ${item.classification} ${item.parentId ?? ''}`.toLowerCase().includes(term))
  return <Dialog title="Find a celestial object" onClose={onClose}>
    <label className="search-field">
      <Search size={18} aria-hidden="true" />
      <input autoFocus aria-label="Search celestial objects" placeholder="Search by name or type…" value={query} onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && matches[0]) onSelect(matches[0].id)
        }} />
    </label>
    {matches.length ? <ul className="search-results">
      {matches.map(item => <li key={item.id}>
        <button onClick={() => onSelect(item.id)}>
          <span className="search-thumbnail"><BodyImage body={item} /></span>
          <span>{item.name}<small>{item.classification}</small></span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </li>)}
    </ul> : <p className="empty-search" role="status">No objects match “{query}”.</p>}
  </Dialog>
}

function About({ onClose }: { onClose: () => void }) {
  return <Dialog title="Explore COSMOS" onClose={onClose}>
    <p>Drag to rotate the scene and scroll over it or use the zoom buttons to move closer. In Solar system view, select a planet to open its details.</p>
    <dl className="shortcuts">
      <div><dt><kbd>/</kbd></dt><dd>Find an object</dd></div>
      <div><dt><kbd>Space</kbd></dt><dd>Play or pause movement</dd></div>
      <div><dt><kbd>Esc</kbd></dt><dd>Close a dialog</dd></div>
    </dl>
    <h3>Data and imagery</h3>
    <p>The simulation uses simplified elliptical orbits and illustrative starting positions. Distance scale shows proportional body sizes and orbital distances, with locator dots to help you find each planet.</p>
    <p>Physical references from <a href="https://ssd.jpl.nasa.gov/planets/phys_par.html" target="_blank" rel="noreferrer">JPL</a> and <a href="https://science.nasa.gov/solar-system/" target="_blank" rel="noreferrer">NASA Science</a>. Planet maps and adapted previews from <a href="https://play.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Solar System Scope</a> under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</p>
    <p><a href={`${import.meta.env.BASE_URL}textures/CREDITS.txt`} target="_blank" rel="noreferrer">Full image credits</a></p>
  </Dialog>
}

function App() {
  const reducedMotion = useReducedMotion()
  const [selectedId, setSelectedId] = useState('saturn')
  const [view, setView] = useState<View>('planet')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [playing, setPlaying] = useState(!reducedMotion)
  const [speed, setSpeed] = useState(1)
  const [scale, setScale] = useState<'cinematic' | 'scientific'>('cinematic')
  const [zoom, setZoom] = useState(1)
  const [resetVersion, setResetVersion] = useState(0)
  const simulationClock = useRef(0)
  const explorerRef = useRef<HTMLElement>(null)
  const body = bodyById.get(selectedId) ?? sun
  const motionSpeed = playing ? speed : 0

  const adjustZoom = useCallback((amount: number) => {
    setZoom(value => Math.min(2.1, Math.max(.65, value + amount)))
  }, [])

  const openBody = useCallback((id: string) => {
    setSelectedId(id)
    setView('planet')
    setZoom(1)
    setOverlay(null)
  }, [])

  function switchView(target: View) {
    setView(target)
    setZoom(1)
  }

  function selectFromIndex(id: string) {
    if (view === 'compare') setSelectedId(id)
    else openBody(id)
    const explorer = explorerRef.current
    if (explorer && explorer.getBoundingClientRect().top < 0) {
      explorer.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'instant' : 'smooth' })
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (overlay || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, [contenteditable]')) return
      if (event.key === '/') {
        event.preventDefault()
        setOverlay('search')
      }
      if (event.code === 'Space' && view !== 'compare' && !(event.target instanceof HTMLElement && event.target.closest('button, a'))) {
        event.preventDefault()
        setPlaying(value => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [overlay, view])

  const tools = [
    { id: 'planet' as const, name: 'Planet view', icon: CircleDot },
    { id: 'system' as const, name: 'Solar system', icon: Orbit },
    { id: 'compare' as const, name: 'Compare', icon: Ruler },
  ]

  return <>
    <header className="topbar">
      <div className="header-brand">
        <Brand onClick={() => openBody('saturn')} />
        <span className="brand-description">SOLAR SYSTEM ATLAS</span>
      </div>
      <nav className="view-tabs" aria-label="Explorer views">
        {tools.map(({ id, name, icon: Icon }) => <button key={id} aria-pressed={view === id} onClick={() => switchView(id)}>
          <Icon size={16} aria-hidden="true" /><span>{name}</span>
        </button>)}
      </nav>
      <button className="search-button" onClick={() => setOverlay('search')} aria-label="Find an object">
        <Search size={17} /><span>Find an object</span><kbd>/</kbd>
      </button>
    </header>
    <main className="shell">
      <section className="explorer" aria-label="Solar system explorer" ref={explorerRef}>
        <div className="viewport" data-view={view}
          style={starTexture ? { '--star-map': `url("${starTexture}")` } as CSSProperties : undefined}>
          <div className="starfield" aria-hidden="true" />
          <div className="viewport-top">
            <div className="breadcrumb"><span>Solar system</span>{view === 'planet' && <><ChevronRight size={13} /><strong>{body.name}</strong></>}</div>
            {view !== 'compare' && <span className={`simulation-status ${playing ? 'running' : ''}`}><i />{playing ? 'In motion' : 'Paused'}</span>}
          </div>
          <div className="scene">
            {view === 'planet' && <PlanetView key={`${body.id}-${resetVersion}`} body={body} speed={motionSpeed}
              zoom={zoom} reducedMotion={reducedMotion} onZoom={adjustZoom} />}
            {view === 'system' && <Orrery key={resetVersion} selectedId={body.id} onSelect={openBody}
              speed={motionSpeed} scale={scale} zoom={zoom} reducedMotion={reducedMotion} elapsed={simulationClock} />}
            {view === 'compare' && <CompareView body={body} onBodyChange={setSelectedId} />}
          </div>
          {view !== 'compare' && <>
            <div className="scene-tools" aria-label="Camera controls">
              <button className="icon-button" disabled={zoom >= 2.1} aria-label="Zoom in" title="Zoom in" onClick={() => adjustZoom(.18)}><Plus size={17} /></button>
              <button className="icon-button" disabled={zoom <= .65} aria-label="Zoom out" title="Zoom out" onClick={() => adjustZoom(-.18)}><Minus size={17} /></button>
              <button className="icon-button" aria-label="Reset camera" title="Reset camera" onClick={() => { setZoom(1); setResetVersion(value => value + 1) }}><Focus size={17} /></button>
            </div>
            <div className="viewport-bottom">
              <div className="timeline" aria-label="Animation controls">
                <button aria-label={playing ? 'Pause animation' : 'Play animation'} title={playing ? 'Pause animation' : 'Play animation'}
                  className="play-button" onClick={() => setPlaying(value => !value)}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
                <label className="speed-control">
                  <ArrowDownUp size={14} aria-hidden="true" />
                  <select aria-label="Animation speed and direction" value={speed} onChange={event => {
                    setSpeed(Number(event.target.value))
                    setPlaying(true)
                  }}>
                    {speedOptions.map(option => <option key={option} value={option}>{option < 0 ? '−' : ''}{Math.abs(option)}×</option>)}
                  </select>
                </label>
              </div>
              {view === 'system' && <select className="scale-control" aria-label="Orbit distance scale" value={scale}
                onChange={event => setScale(event.target.value === 'scientific' ? 'scientific' : 'cinematic')}>
                <option value="cinematic">Cinematic scale</option>
                <option value="scientific">Distance scale</option>
              </select>}
              {view === 'planet' && <span className="camera-hint"><Maximize size={13} /> Drag to rotate</span>}
            </div>
          </>}
        </div>
        <PlanetDetails body={body} view={view} onSelect={view === 'compare' ? setSelectedId : openBody}
          onFocus={() => openBody(body.id)} />
      </section>

      <section className="planet-index" aria-labelledby="planet-index-title">
        <div className="index-heading">
          <h2 id="planet-index-title">Planet index</h2>
          <button className="index-action" onClick={() => selectFromIndex('sun')}><Sparkles size={15} /> View the Sun</button>
        </div>
        <div className="planet-grid">
          {planets.map((item, index) => <button key={item.id} className={`planet-card ${item.id === selectedId ? 'selected' : ''}`}
            aria-pressed={item.id === selectedId} onClick={() => selectFromIndex(item.id)}>
            <span className="planet-index-number">{String(index + 1).padStart(2, '0')}</span>
            <span className={`planet-thumbnail planet-thumbnail--${item.id}`}><BodyImage body={item} /></span>
            <span className="planet-name">{item.name}</span>
          </button>)}
        </div>
      </section>
    </main>
    <footer className="footer">
      <span>Planetary data from NASA &amp; JPL</span>
      <button onClick={() => setOverlay('about')}><CircleHelp size={15} /> Controls &amp; sources</button>
    </footer>
    {overlay === 'search' && <SearchObjects onSelect={openBody} onClose={() => setOverlay(null)} />}
    {overlay === 'about' && <About onClose={() => setOverlay(null)} />}
  </>
}

createRoot(document.getElementById('root')!).render(<App />)
