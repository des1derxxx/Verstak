import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, Circle, CircleCheck, Clock3, Download, FileText, FolderKanban, GripVertical, LayoutGrid, List, Menu, MoreHorizontal, Plus, Search, Settings2, Sparkles, SquareCheck, Trash2, Upload, X } from 'lucide-react';
import { colors, isDue, localDate, moveTask, parseWorkspace, priorityNames, seedWorkspace, statuses, statusNames, STORAGE_KEY } from './domain';
import type { Note, Priority, Project, Status, Task, Workspace } from './domain';

type View = 'board' | 'list' | 'notes';
type ModalState = { kind: 'task'; task?: Task; status?: Status } | { kind: 'project'; project?: Project } | { kind: 'note'; note?: Note } | { kind: 'data' } | null;

function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return { workspace: saved ? parseWorkspace(JSON.parse(saved)) : seedWorkspace(), blocked: false };
  } catch {
    return { workspace: seedWorkspace(), blocked: true };
  }
}

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dueLabel(value: string) {
  if (value === localDate()) return 'Сегодня';
  return new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function StatusIcon({ status }: { status: Status }) {
  return status === 'done' ? <CircleCheck size={15} /> : status === 'progress' ? <Clock3 size={15} /> : status === 'todo' ? <Circle size={15} /> : <MoreHorizontal size={15} />;
}

function PriorityIcon({ priority }: { priority: Priority }) {
  return priority === 'high' ? <ArrowUp size={14} /> : priority === 'low' ? <ArrowDown size={14} /> : <span className="medium-priority">=</span>;
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <div className="modal-heading"><span>{title}</span><button className="icon-button" aria-label="Закрыть" onClick={onClose}><X size={19} /></button></div>{children}
  </dialog>;
}

function TaskForm({ task, status, projects, projectId, onSave, onDelete, onClose }: { task?: Task; status?: Status; projects: Project[]; projectId: string; onSave: (task: Task) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Task>(() => task ? structuredClone(task) : { id: crypto.randomUUID(), projectId: projects.some(project => project.id === projectId) ? projectId : projects[0].id, title: '', description: '', status: status ?? 'todo', priority: 'medium', due: '', labels: [], checklist: [], createdAt: new Date().toISOString() });
  const [checkText, setCheckText] = useState('');
  const [deleting, setDeleting] = useState(false);
  function update<K extends keyof Task>(key: K, value: Task[K]) { setDraft(previous => ({ ...previous, [key]: value })); }
  function addCheck() { if (checkText.trim()) { update('checklist', [...draft.checklist, { id: crypto.randomUUID(), text: checkText.trim(), done: false }]); setCheckText(''); } }
  function submit(event: FormEvent) { event.preventDefault(); if (draft.title.trim()) onSave({ ...draft, title: draft.title.trim(), labels: draft.labels.map(label => label.trim()).filter(Boolean) }); }
  return <Modal title={task ? 'Задача' : 'Новая задача'} onClose={onClose} wide>
    <form onSubmit={submit} className="editor-form">
      <label className="sr-only" htmlFor="task-title">Название задачи</label><input autoFocus id="task-title" className="title-input" placeholder="Что нужно сделать?" required maxLength={180} value={draft.title} onChange={event => update('title', event.target.value)} />
      <div className="form-grid">
        <label>Проект<select value={draft.projectId} onChange={event => update('projectId', event.target.value)}>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        <label>Статус<select value={draft.status} onChange={event => update('status', event.target.value as Status)}>{statuses.map(value => <option value={value} key={value}>{statusNames[value]}</option>)}</select></label>
        <label>Приоритет<select value={draft.priority} onChange={event => update('priority', event.target.value as Priority)}>{Object.entries(priorityNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Срок<input type="date" value={draft.due} onChange={event => update('due', event.target.value)} /></label>
      </div>
      <label>Описание<textarea rows={4} placeholder="Контекст, ссылки и всё, что пригодится…" value={draft.description} onChange={event => update('description', event.target.value)} /></label>
      <label>Метки <span className="muted">через запятую</span><input placeholder="Дизайн, разработка…" value={draft.labels.join(',')} onChange={event => update('labels', event.target.value.split(','))} /></label>
      <div className="checklist-editor"><span className="field-label">Чеклист</span>{draft.checklist.map(item => <div className="checklist-item" key={item.id}><input aria-label={item.text} type="checkbox" checked={item.done} onChange={() => update('checklist', draft.checklist.map(check => check.id === item.id ? { ...check, done: !check.done } : check))} /><span className={item.done ? 'struck' : ''}>{item.text}</span><button type="button" className="icon-button" aria-label={`Удалить пункт: ${item.text}`} onClick={() => update('checklist', draft.checklist.filter(check => check.id !== item.id))}><X size={14} /></button></div>)}<div className="check-add"><input placeholder="Добавить пункт…" aria-label="Новый пункт чеклиста" value={checkText} onChange={event => setCheckText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCheck(); } }} /><button type="button" className="icon-button" aria-label="Добавить пункт" onClick={addCheck} disabled={!checkText.trim()}><Plus size={18} /></button></div></div>
      <div className="modal-footer">{task && <button type="button" className="text-button danger" onClick={() => setDeleting(!deleting)}><Trash2 size={15} />Удалить</button>}<div className="footer-actions"><button type="button" className="button secondary" onClick={onClose}>Отмена</button><button className="button primary" type="submit" disabled={!draft.title.trim()}>Сохранить задачу</button></div></div>
      {deleting && <div className="delete-confirm"><span>Удалить эту задачу?</span><button type="button" className="button danger-button" onClick={() => onDelete(task!.id)}>Да, удалить</button></div>}
    </form>
  </Modal>;
}

function ProjectForm({ project, onSave, onDelete, onClose }: { project?: Project; onSave: (project: Project) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [color, setColor] = useState(project?.color ?? colors[0]);
  const [deleting, setDeleting] = useState(false);
  return <Modal title={project ? 'Настройки проекта' : 'Новый проект'} onClose={onClose}><form className="editor-form" onSubmit={event => { event.preventDefault(); if (name.trim()) onSave({ id: project?.id ?? crypto.randomUUID(), name: name.trim(), description: description.trim(), color }); }}>
    <label>Название<input autoFocus required maxLength={80} placeholder="Например, мой следующий большой проект" value={name} onChange={event => setName(event.target.value)} /></label>
    <label>Описание<textarea rows={3} placeholder="Что ты хочешь сделать?" value={description} onChange={event => setDescription(event.target.value)} /></label>
    <fieldset className="color-field"><legend>Цвет проекта</legend>{colors.map(value => <button key={value} aria-label={`Цвет ${value}`} aria-pressed={color === value} type="button" style={{ background: value }} onClick={() => setColor(value)}>{color === value && <Check size={17} />}</button>)}</fieldset>
    <div className="modal-footer">{project && <button type="button" className="text-button danger" onClick={() => setDeleting(!deleting)}><Trash2 size={15} />Удалить</button>}<div className="footer-actions"><button type="button" className="button secondary" onClick={onClose}>Отмена</button><button type="submit" className="button primary" disabled={!name.trim()}>{project ? 'Сохранить' : 'Создать проект'}</button></div></div>
    {deleting && <div className="delete-confirm"><span>Проект, его задачи и заметки будут удалены.</span><button type="button" className="button danger-button" onClick={() => onDelete(project!.id)}>Удалить всё</button></div>}
  </form></Modal>;
}

function Markdown({ text }: { text: string }) {
  return <div className="markdown">{text.split('\n').map((line, index) => line.startsWith('### ') ? <h3 key={index}>{line.slice(4)}</h3> : line.startsWith('## ') ? <h2 key={index}>{line.slice(3)}</h2> : line.startsWith('# ') ? <h1 key={index}>{line.slice(2)}</h1> : line.startsWith('- ') ? <div className="markdown-bullet" key={index}><span>•</span>{line.slice(2)}</div> : <p key={index}>{line || '\u00a0'}</p>)}</div>;
}

function NoteForm({ note, projects, projectId, onSave, onDelete, onClose }: { note?: Note; projects: Project[]; projectId: string; onSave: (note: Note) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [project, setProject] = useState(note?.projectId ?? (projects.some(p => p.id === projectId) ? projectId : projects[0].id));
  const [preview, setPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return <Modal title={note ? 'Заметка проекта' : 'Новая заметка'} onClose={onClose} wide><form className="editor-form" onSubmit={event => { event.preventDefault(); if (title.trim()) onSave({ id: note?.id ?? crypto.randomUUID(), projectId: project, title: title.trim(), body, updatedAt: new Date().toISOString() }); }}>
    <input autoFocus className="title-input" aria-label="Название заметки" required maxLength={180} placeholder="Название заметки" value={title} onChange={event => setTitle(event.target.value)} />
    <div className="note-editor-toolbar"><label className="sr-only" htmlFor="note-project">Проект заметки</label><select id="note-project" value={project} onChange={event => setProject(event.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="segmented"><button type="button" aria-pressed={!preview} className={!preview ? 'active' : ''} onClick={() => setPreview(false)}>Текст</button><button type="button" aria-pressed={preview} className={preview ? 'active' : ''} onClick={() => setPreview(true)}>Просмотр</button></div></div>
    {preview ? <div className="note-preview"><Markdown text={body || 'Здесь появится твоя заметка.'} /></div> : <textarea className="note-textarea" aria-label="Текст заметки" rows={13} placeholder={'Записывай идеи и решения…\n\n# Заголовок\n## Подзаголовок\n- Пункт списка'} value={body} onChange={event => setBody(event.target.value)} />}
    <div className="modal-footer">{note && <button type="button" className="text-button danger" onClick={() => setDeleting(!deleting)}><Trash2 size={15} />Удалить</button>}<div className="footer-actions"><button type="button" className="button secondary" onClick={onClose}>Отмена</button><button type="submit" className="button primary" disabled={!title.trim()}>Сохранить заметку</button></div></div>
    {deleting && <div className="delete-confirm"><span>Удалить эту заметку?</span><button type="button" className="button danger-button" onClick={() => onDelete(note!.id)}>Да, удалить</button></div>}
  </form></Modal>;
}

function DataModal({ workspace, blocked, onImport, onClose }: { workspace: Workspace; blocked: boolean; onImport: (workspace: Workspace) => void; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  async function readFile(file?: File) {
    if (!file) return;
    setPending(null); setError('');
    if (file.size > 10 * 1024 * 1024) { setError('Размер копии должен быть не больше 10 МБ.'); return; }
    try { setPending(parseWorkspace(JSON.parse(await file.text()))); } catch (error) { setError(error instanceof Error ? error.message : 'Не удалось прочитать файл.'); }
  }
  return <Modal title="Твои данные" onClose={onClose}><div className="editor-form"><div className="data-illustration"><FolderKanban size={32} strokeWidth={1.3} /></div><h2 className="data-title">Всё остаётся у тебя</h2><p className="body-muted">Проекты хранятся в этом браузере. Скачивай резервные копии, чтобы перенести их на другое устройство или восстановить после очистки браузера.</p><div className="data-stats"><span><b>{workspace.projects.length}</b> проектов</span><span><b>{workspace.tasks.length}</b> задач</span><span><b>{workspace.notes.length}</b> заметок</span></div>
    <button className="button secondary full-width" onClick={() => download(JSON.stringify(workspace, null, 2), `verstak-${localDate()}.json`)}><Download size={17} />Скачать резервную копию</button>
    {blocked && <button className="button secondary full-width" onClick={() => download(localStorage.getItem(STORAGE_KEY) ?? '', `verstak-recovery-${localDate()}.json`)}>Скачать исходные данные для восстановления</button>}
    <button className="button secondary full-width" onClick={() => input.current?.click()}><Upload size={17} />Импортировать из файла</button><input ref={input} className="sr-only" type="file" accept=".json,application/json" onChange={event => { void readFile(event.target.files?.[0]); event.target.value = ''; }} />
    {error && <p role="alert" className="error-text">{error}</p>}
    {pending && <div className="import-confirm"><b>Заменить текущие данные?</b><p>В файле: {pending.projects.length} проектов, {pending.tasks.length} задач, {pending.notes.length} заметок. Сначала скачай копию текущих данных.</p><div className="footer-actions"><button className="button secondary" onClick={() => setPending(null)}>Отмена</button><button className="button primary" onClick={() => onImport(pending)}>Заменить данные</button></div></div>}
    <p className="small-print">Verstak · Локальная версия 0.1</p>
  </div></Modal>;
}

export default function App() {
  const [initial] = useState(loadWorkspace);
  const [workspace, setWorkspace] = useState(initial.workspace);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [storageError, setStorageError] = useState('');
  const [selected, setSelected] = useState(initial.workspace.projects[0]?.id ?? 'all');
  const [view, setView] = useState<View>('board');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [modal, setModal] = useState<ModalState>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { function keydown(event: KeyboardEvent) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); } } window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown); }, []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); } }, [toast]);

  function commit(next: Workspace, message?: string, replace = false) {
    if (blocked && !replace) { setToast('Сначала восстанови данные через раздел «Твои данные».'); return false; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageError(''); if (replace) setBlocked(false); }
    catch { setStorageError('Не удалось сохранить изменения в браузере. Скачай резервную копию перед закрытием страницы.'); }
    setWorkspace(next); if (message) setToast(message); return true;
  }
  function select(id: string) { setSelected(id); setSearch(''); setPriority('all'); setSidebarOpen(false); }
  function newTask(status?: Status) { setModal(workspace.projects.length ? { kind: 'task', status } : { kind: 'project' }); }
  const project = workspace.projects.find(item => item.id === selected);
  const title = project?.name ?? (selected === 'today' ? 'Сегодня' : 'Все задачи');
  const description = project?.description ?? (selected === 'today' ? 'Самое время сделать следующий шаг. Здесь задачи на сегодня и просроченные.' : 'Общая картина твоих проектов. Всё важное в одном месте.');
  const scopeTasks = workspace.tasks.filter(task => project ? task.projectId === project.id : selected === 'today' ? isDue(task) : true);
  const normalized = search.trim().toLocaleLowerCase('ru');
  const filtered = scopeTasks.filter(task => (priority === 'all' || task.priority === priority) && (!normalized || [task.title, task.description, ...task.labels, workspace.projects.find(p => p.id === task.projectId)?.name].join(' ').toLocaleLowerCase('ru').includes(normalized)));
  const notes = workspace.notes.filter(note => (!project || note.projectId === project.id) && (!normalized || `${note.title} ${note.body}`.toLocaleLowerCase('ru').includes(normalized))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const done = scopeTasks.filter(task => task.status === 'done').length;
  const active = scopeTasks.filter(task => task.status === 'progress').length;
  const progress = scopeTasks.length ? Math.round(done / scopeTasks.length * 100) : 0;
  const taskProject = (task: Task) => workspace.projects.find(p => p.id === task.projectId)!;

  function taskCard(task: Task) {
    const checked = task.checklist.filter(check => check.done).length;
    return <button key={task.id} className={`task-card ${task.status === 'done' ? 'is-done' : ''}`} draggable onDragStart={event => { event.dataTransfer.setData('text/plain', task.id); event.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDragOver(null)} onClick={() => setModal({ kind: 'task', task })}>
      <div className="card-top"><div className="tags">{task.labels.slice(0, 2).map((label, index) => <span className={`tag tag-${index}`} key={`${label}-${index}`}>{label}</span>)}{!project && <span className="project-card-label">{taskProject(task).name}</span>}</div><GripVertical size={14} className="drag-grip" /></div>
      <span className="task-card-title">{task.title}</span>{task.description && <span className="task-card-description">{task.description}</span>}
      <div className="card-footer"><span className={`priority priority-${task.priority}`} title={`Приоритет: ${priorityNames[task.priority]}`}><PriorityIcon priority={task.priority} /><span>{priorityNames[task.priority]}</span></span><span className="card-meta">{task.checklist.length > 0 && <span><SquareCheck size={13} />{checked}/{task.checklist.length}</span>}{task.due && <span className={task.due < localDate() && task.status !== 'done' ? 'overdue' : ''}><CalendarDays size={13} />{dueLabel(task.due)}</span>}</span></div>
    </button>;
  }

  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-scrim" aria-label="Закрыть меню" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
      <a className="brand" href="#" onClick={event => { event.preventDefault(); select('all'); }}><span className="brand-mark"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m8 9 8 15 8-15M12 9l4 8 4-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span>verstak<span className="brand-period">.</span></span></a>
      <div className="workspace-label"><span className="avatar">Я</span><div><strong>Моё пространство</strong><span>Личное</span></div><span className="personal-badge">1</span></div>
      <nav className="primary-nav" aria-label="Рабочее пространство"><button className={selected === 'all' ? 'selected' : ''} onClick={() => select('all')}><LayoutGrid size={18} />Все задачи<span className="nav-count">{workspace.tasks.filter(task => task.status !== 'done').length}</span></button><button className={selected === 'today' ? 'selected' : ''} onClick={() => { select('today'); setView('list'); }}><CalendarDays size={18} />Сегодня{workspace.tasks.filter(task => isDue(task)).length > 0 && <span className="nav-count">{workspace.tasks.filter(task => isDue(task)).length}</span>}</button></nav>
      <div className="sidebar-section-heading"><span>Мои проекты</span><button className="icon-button" title="Создать проект" aria-label="Создать проект" onClick={() => setModal({ kind: 'project' })}><Plus size={17} /></button></div>
      <nav className="project-nav" aria-label="Проекты">{workspace.projects.map(item => <button key={item.id} className={selected === item.id ? 'selected' : ''} onClick={() => select(item.id)}><span className="project-dot" style={{ background: item.color }} /> <span className="project-nav-name">{item.name}</span><ChevronRight size={14} /></button>)}<button className="add-project" onClick={() => setModal({ kind: 'project' })}><Plus size={16} />Новый проект</button></nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="tiny-spark"><Sparkles size={17} /></span><p>Большие дела начинаются<br />с маленького шага.</p></div><button className="data-link" onClick={() => setModal({ kind: 'data' })}><Settings2 size={17} />Данные и резервные копии</button><div className="local-indicator"><span />На этом устройстве<span className="version">v0.1</span></div></div>
    </aside>

    <main className="main-area"><header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu" aria-label="Открыть меню" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button><span>Моё пространство</span><ChevronRight size={13} /><strong>{title}</strong></div><span className="topbar-note"><span className="status-dot" />Твой рабочий ритм</span></header>
      <div className="content">
        {(blocked || storageError) && <div role="alert" className="storage-alert">{blocked ? 'Не удалось прочитать сохранённые данные. Исходная копия не изменена. Открой «Данные и резервные копии», чтобы скачать её и импортировать исправленную.' : storageError}<button onClick={() => setModal({ kind: 'data' })}>Открыть данные<ArrowUpRight size={15} /></button></div>}
        <div className="project-heading"><div><div className="eyebrow"><span className="project-dot" style={{ background: project?.color ?? colors[0] }} />{project ? 'Личный проект' : 'Рабочее пространство'}</div><div className="title-row"><h1>{title}</h1>{project && <button className="icon-button project-settings" aria-label="Настройки проекта" onClick={() => setModal({ kind: 'project', project })}><MoreHorizontal size={23} /></button>}</div><p className="project-description">{description || 'Добавляй задачи, собирай идеи и двигай проект вперёд.'}</p></div><button className="button primary create-task" onClick={() => view === 'notes' ? setModal(workspace.projects.length ? { kind: 'note' } : { kind: 'project' }) : newTask()}><Plus size={17} />{view === 'notes' ? 'Новая заметка' : 'Новая задача'}</button></div>
        <div className="project-overview"><div className="overview-item"><span className="overview-icon"><FolderKanban size={18} /></span><span><strong>{scopeTasks.length}</strong> всего задач</span></div><div className="overview-item"><span className="overview-icon in-progress"><Clock3 size={18} /></span><span><strong>{active}</strong> в работе</span></div><div className="overview-item"><span className="overview-icon completed"><CircleCheck size={18} /></span><span><strong>{done}</strong> готово</span></div><div className="completion"><span>Прогресс <strong>{progress}%</strong></span><div className="progress-track" role="progressbar" aria-label="Прогресс проекта" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${progress}%` }} /></div></div></div>
        <div className="view-tabs" role="tablist" aria-label="Представление проекта">{([{ id: 'board', label: 'Доска', icon: LayoutGrid }, { id: 'list', label: 'Список', icon: List }, { id: 'notes', label: 'Заметки', icon: FileText }] as const).map(tab => <button id={`tab-${tab.id}`} role="tab" aria-selected={view === tab.id} aria-controls="view-panel" key={tab.id} className={view === tab.id ? 'active' : ''} onClick={() => setView(tab.id)}><tab.icon size={16} />{tab.label}{tab.id === 'notes' && <span className="tab-count">{workspace.notes.filter(note => !project || note.projectId === project.id).length}</span>}</button>)}</div>
        <div className="toolbar"><div className="search-field"><Search size={17} /><input ref={searchRef} aria-label="Поиск по проекту" placeholder={view === 'notes' ? 'Найти заметку…' : 'Найти задачу…'} value={search} onChange={event => setSearch(event.target.value)} />{search ? <button className="icon-button" aria-label="Очистить поиск" onClick={() => setSearch('')}><X size={14} /></button> : <kbd>⌘ K</kbd>}</div><div className="toolbar-right">{view !== 'notes' && <div className="filter-select"><Settings2 size={15} /><select aria-label="Фильтр по приоритету" value={priority} onChange={event => setPriority(event.target.value)}><option value="all">Все приоритеты</option><option value="high">Высокий</option><option value="medium">Средний</option><option value="low">Низкий</option></select><ChevronDown size={13} /></div>}<span className="result-count">{view === 'notes' ? notes.length : filtered.length} {view === 'notes' ? 'заметок' : 'задач'}</span></div></div>
        <div id="view-panel" role="tabpanel" aria-labelledby={`tab-${view}`}>
          {view === 'board' && <div className="board">{statuses.map(status => <section key={status} className={`board-column column-${status} ${dragOver === status ? 'drag-over' : ''}`} aria-label={statusNames[status]} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOver(status); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(null); }} onDrop={event => { event.preventDefault(); setDragOver(null); const id = event.dataTransfer.getData('text/plain'); if (workspace.tasks.some(task => task.id === id)) commit(moveTask(workspace, id, status), `Задача перемещена в «${statusNames[status]}»`); }}><div className="column-heading"><div><span className={`status-icon status-${status}`}><StatusIcon status={status} /></span><h2>{statusNames[status]}</h2><span className="column-count">{filtered.filter(task => task.status === status).length}</span></div><button className="icon-button" aria-label={`Добавить задачу: ${statusNames[status]}`} onClick={() => newTask(status)}><Plus size={16} /></button></div><div className="column-cards">{filtered.filter(task => task.status === status).map(taskCard)}{!filtered.some(task => task.status === status) && <div className="column-empty">{search || priority !== 'all' ? 'Нет подходящих задач' : 'Здесь пока пусто'}</div>}<button className="add-task" onClick={() => newTask(status)}><Plus size={16} />Добавить задачу</button></div></section>)}</div>}
          {view === 'list' && <div className="task-list"><div className="list-header"><span>Задача</span><span>Статус</span><span>Приоритет</span><span>Срок</span></div>{filtered.map(task => <button key={task.id} className="list-row" onClick={() => setModal({ kind: 'task', task })}><span className="list-task-title"><span className={`status-icon status-${task.status}`}><StatusIcon status={task.status} /></span><span><strong>{task.title}</strong>{!project && <small>{taskProject(task).name}</small>}</span></span><span className={`list-status status-${task.status}`}>{statusNames[task.status]}</span><span className={`priority priority-${task.priority}`}><PriorityIcon priority={task.priority} />{priorityNames[task.priority]}</span><span className={`list-date ${task.due && task.due < localDate() && task.status !== 'done' ? 'overdue' : ''}`}>{task.due ? dueLabel(task.due) : '—'}</span></button>)}{!filtered.length && <div className="empty-state"><CheckCheck size={30} strokeWidth={1.4} /><h3>{search || priority !== 'all' ? 'Ничего не нашлось' : selected === 'today' ? 'На сегодня всё спокойно' : 'Здесь начнётся твой план'}</h3><p>{search || priority !== 'all' ? 'Попробуй другой запрос или измени фильтр.' : selected === 'today' ? 'Задачи со сроком на сегодня и просроченные появятся здесь.' : 'Добавь первую задачу и сделай следующий шаг.'}</p><button className="button secondary" onClick={() => newTask()}><Plus size={16} />Новая задача</button></div>}</div>}
          {view === 'notes' && <div className="notes-grid">{notes.map(note => <button className="note-card" key={note.id} onClick={() => setModal({ kind: 'note', note })}><span className="note-icon"><FileText size={23} strokeWidth={1.5} /></span><h2>{note.title}</h2><p>{note.body.replace(/^#+\s/gm, '').replace(/^-\s/gm, '').slice(0, 180) || 'Пустая заметка'}</p><div><span>{workspace.projects.find(p => p.id === note.projectId)?.name}</span><span>{new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' }).format(new Date(note.updatedAt))}</span></div></button>)}{!notes.length && <div className="empty-state"><FileText size={30} strokeWidth={1.4} /><h3>{search ? 'Ничего не нашлось' : 'Место для твоих идей'}</h3><p>{search ? 'Попробуй другой поисковый запрос.' : 'Сохраняй здесь планы, решения и контекст проекта.'}</p><button className="button secondary" onClick={() => setModal(workspace.projects.length ? { kind: 'note' } : { kind: 'project' })}><Plus size={16} />Новая заметка</button></div>}</div>}
        </div>
        <div className="board-hint">{view === 'board' ? <><GripVertical size={13} />Перетаскивай задачи между колонками или открой карточку, чтобы изменить статус.</> : view === 'notes' ? <><FileText size={13} />У каждого проекта есть место для мыслей.</> : <><SquareCheck size={13} />Открой задачу, чтобы добавить детали и выбрать следующий шаг.</>}</div>
      </div>
    </main>
    {modal?.kind === 'task' && workspace.projects.length > 0 && <TaskForm task={modal.task} status={modal.status} projects={workspace.projects} projectId={selected} onClose={() => setModal(null)} onSave={task => { const exists = workspace.tasks.some(item => item.id === task.id); if (commit({ ...workspace, tasks: exists ? workspace.tasks.map(item => item.id === task.id ? task : item) : [...workspace.tasks, task] }, exists ? 'Задача сохранена' : 'Задача создана')) setModal(null); }} onDelete={id => { if (commit({ ...workspace, tasks: workspace.tasks.filter(task => task.id !== id) }, 'Задача удалена')) setModal(null); }} />}
    {modal?.kind === 'project' && <ProjectForm project={modal.project} onClose={() => setModal(null)} onSave={item => { const exists = workspace.projects.some(p => p.id === item.id); if (commit({ ...workspace, projects: exists ? workspace.projects.map(p => p.id === item.id ? item : p) : [...workspace.projects, item] }, exists ? 'Проект сохранён' : 'Проект создан')) { select(item.id); setModal(null); } }} onDelete={id => { if (commit({ ...workspace, projects: workspace.projects.filter(p => p.id !== id), tasks: workspace.tasks.filter(task => task.projectId !== id), notes: workspace.notes.filter(note => note.projectId !== id) }, 'Проект удалён')) { select('all'); setModal(null); } }} />}
    {modal?.kind === 'note' && workspace.projects.length > 0 && <NoteForm note={modal.note} projects={workspace.projects} projectId={selected} onClose={() => setModal(null)} onSave={note => { if (commit({ ...workspace, notes: workspace.notes.some(n => n.id === note.id) ? workspace.notes.map(n => n.id === note.id ? note : n) : [...workspace.notes, note] }, 'Заметка сохранена')) setModal(null); }} onDelete={id => { if (commit({ ...workspace, notes: workspace.notes.filter(note => note.id !== id) }, 'Заметка удалена')) setModal(null); }} />}
    {modal?.kind === 'data' && <DataModal workspace={workspace} blocked={blocked} onClose={() => setModal(null)} onImport={next => { if (commit(next, 'Данные импортированы', true)) { setSelected(next.projects[0]?.id ?? 'all'); setSearch(''); setPriority('all'); setModal(null); } }} />}
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast && <><CircleCheck size={17} />{toast}</>}</div>
  </div>;
}
