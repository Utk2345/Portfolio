import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Github,
  Linkedin,
  Mail,
  Menu,
  Moon,
  Pencil,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";

type ProjectTheme = "lime" | "blue" | "peach";

type Project = {
  id: string;
  title: string;
  year: string;
  category: "Product" | "Brand" | "Experiments";
  description: string;
  tags: string[];
  theme: ProjectTheme;
  liveUrl?: string;
  sourceUrl?: string;
  /** Optional card image: a path in client/public (e.g. "/projects/twelve-leaves.png") or a full URL. */
  image?: string;
  featured?: boolean;
};

type ProjectForm = Omit<Project, "id" | "tags" | "featured" | "liveUrl" | "sourceUrl" | "image"> & {
  tagsInput: string;
  liveUrl: string;
  sourceUrl: string;
  image: string;
};

// Editing tools (add / edit / delete) only appear in local development. Visitors always see
// the projects defined in `defaultProjects` below.
const CAN_EDIT = import.meta.env.DEV;
const STORAGE_KEY = "folioframe-projects";
const THEME_KEY = "folioframe-theme";
const categories = ["All", "Product", "Brand", "Experiments"] as const;
type Filter = (typeof categories)[number];

type ContactForm = {
  name: string;
  email: string;
  message: string;
  website: string; // honeypot, hidden from real visitors
};

const defaultProjects: Project[] = [
  {
    id: "Twelve Leaves",
    title: "Twelve Leaves",
    year: "2026",
    category: "Experiments",
    description:
      "A garden of habits that grows along with your progress.",
    tags: ["Interaction", "UX/UI", "Web app"],
    theme: "lime",
    liveUrl: "https://habit-garden-nine.vercel.app",
    sourceUrl: "https://github.com/Utk2345/Twelve-Leaves",
    image: "/projects/twelve-leaves.webp", // file lives in client/public/projects/
    featured: true,
  },
];

const emptyForm: ProjectForm = {
  title: "",
  year: new Date().getFullYear().toString(),
  category: "Product",
  description: "",
  theme: "lime",
  liveUrl: "",
  sourceUrl: "",
  image: "",
  tagsInput: "",
};

const emptyContactForm: ContactForm = {
  name: "",
  email: "",
  message: "",
  website: "",
};

function getInitialTheme() {
  if (typeof window === "undefined") return false;
  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") return true;
  if (savedTheme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getInitialProjects() {
  if (typeof window === "undefined" || !CAN_EDIT) return defaultProjects;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultProjects;
    const parsed = JSON.parse(saved) as Project[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultProjects;
  } catch {
    return defaultProjects;
  }
}

const coverImageStyle = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } as const;

function ProjectArtwork({ project }: { project: Project }) {
  if (project.image) {
    return (
      <div className={`artwork artwork--${project.theme}`}>
        <img src={project.image} alt={`${project.title} preview`} loading="lazy" style={coverImageStyle} />
      </div>
    );
  }
  return (
    <div className={`artwork artwork--${project.theme}`} aria-hidden="true">
      <div className="artwork-grid" />
      <span className="artwork-orb artwork-orb--one" />
      <span className="artwork-orb artwork-orb--two" />
      <span className="artwork-label">{project.category}</span>
      <span className="artwork-mark">↗</span>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  onEdit,
  onDelete,
}: {
  project: Project;
  index: number;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  return (
    <article className="project-card">
      <ProjectArtwork project={project} />
      <div className="project-card__body">
        <div className="project-card__meta">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{project.year}</span>
        </div>
        <div className="project-card__title-row">
          <h3>{project.title}</h3>
          <span className="category-pill">{project.category}</span>
        </div>
        <p>{project.description}</p>
        <div className="tag-list">
          {project.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="project-card__footer">
          <div className="card-links">
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer">
                Live work <ArrowUpRight size={14} />
              </a>
            )}
            {project.sourceUrl && (
              <a href={project.sourceUrl} target="_blank" rel="noreferrer">
                Source <Github size={14} />
              </a>
            )}
          </div>
          {CAN_EDIT && <div className="card-actions" aria-label={`Manage ${project.title}`}>
            <button type="button" className="icon-button" onClick={() => onEdit(project)} aria-label={`Edit ${project.title}`}>
              <Pencil size={15} />
            </button>
            <button type="button" className="icon-button icon-button--danger" onClick={() => onDelete(project)} aria-label={`Delete ${project.title}`}>
              <Trash2 size={15} />
            </button>
          </div>}
        </div>
      </div>
    </article>
  );
}

function ProjectModal({
  open,
  mode,
  initialProject,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  initialProject?: Project;
  onClose: () => void;
  onSave: (project: Project) => void;
}) {
  const [form, setForm] = useState<ProjectForm>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (!initialProject) {
      setForm(emptyForm);
      return;
    }
    setForm({
      title: initialProject.title,
      year: initialProject.year,
      category: initialProject.category,
      description: initialProject.description,
      theme: initialProject.theme,
      liveUrl: initialProject.liveUrl ?? "",
      sourceUrl: initialProject.sourceUrl ?? "",
      image: initialProject.image ?? "",
      tagsInput: initialProject.tags.join(", "),
    });
  }, [open, initialProject]);

  if (!open) return null;

  const update = (key: keyof ProjectForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    onSave({
      id: initialProject?.id ?? `project-${Date.now()}`,
      title: form.title.trim(),
      year: form.year.trim() || new Date().getFullYear().toString(),
      category: form.category,
      description: form.description.trim(),
      tags: form.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      theme: form.theme,
      liveUrl: form.liveUrl.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
      image: form.image.trim() || undefined,
      featured: initialProject?.featured,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{mode === "add" ? "New entry" : "Edit entry"}</span>
            <h2 id="project-modal-title">{mode === "add" ? "Add a project" : "Shape the details"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close project form">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid form-grid--two">
            <label>
              Project title
              <input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Aster House" autoFocus required />
            </label>
            <label>
              Year
              <input value={form.year} onChange={(event) => update("year", event.target.value)} placeholder="2024" />
            </label>
          </div>
          <div className="form-grid form-grid--two">
            <label>
              Category
              <select value={form.category} onChange={(event) => update("category", event.target.value as ProjectForm["category"])}>
                <option>Product</option>
                <option>Brand</option>
                <option>Experiments</option>
              </select>
            </label>
            <label>
              Thumbnail tone
              <select value={form.theme} onChange={(event) => update("theme", event.target.value as ProjectTheme)}>
                <option value="lime">Electric lime</option>
                <option value="blue">Studio blue</option>
                <option value="peach">Soft peach</option>
              </select>
            </label>
          </div>
          <label>
            Short description
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="What was the idea, and why did it matter?" rows={4} required />
          </label>
          <label>
            Tags <span className="label-hint">comma separated</span>
            <input value={form.tagsInput} onChange={(event) => update("tagsInput", event.target.value)} placeholder="Strategy, UX/UI, Web" />
          </label>
          <div className="form-grid form-grid--two">
            <label>
              Live link <span className="label-hint">optional</span>
              <input type="url" value={form.liveUrl} onChange={(event) => update("liveUrl", event.target.value)} placeholder="https://" />
            </label>
            <label>
              Source link <span className="label-hint">optional</span>
              <input type="url" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} placeholder="https://github.com/" />
            </label>
          </div>
          <label>
            Card image <span className="label-hint">optional: path like /projects/name.png, or a full URL</span>
            <input value={form.image} onChange={(event) => update("image", event.target.value)} placeholder="/projects/twelve-leaves-logo.webp" />
          </label>
          <div className="modal-actions">
            <button type="button" className="button button--quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button--dark"><Check size={16} /> {mode === "add" ? "Add project" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>(getInitialProjects);
  const [filter, setFilter] = useState<Filter>("All");
  const [darkMode, setDarkMode] = useState(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project>();
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSending, setContactSending] = useState(false);

  useEffect(() => {
    if (CAN_EDIT) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  const featuredProject = projects.find((project) => project.featured) ?? projects[0];
  const filteredProjects = useMemo(
    () => (filter === "All" ? projects : projects.filter((project) => project.category === filter)),
    [filter, projects],
  );

  const openAdd = () => {
    setEditingProject(undefined);
    setModalMode("add");
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setModalMode("edit");
    setModalOpen(true);
  };

  const saveProject = (project: Project) => {
    setProjects((current) => {
      const exists = current.some((item) => item.id === project.id);
      return exists ? current.map((item) => (item.id === project.id ? project : item)) : [project, ...current];
    });
  };

  const deleteProject = (project: Project) => {
    if (!window.confirm(`Remove “${project.title}” from your portfolio?`)) return;
    setProjects((current) => current.filter((item) => item.id !== project.id));
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (contactSending) return;
    setContactError("");
    setContactSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setContactSubmitted(true);
      setContactForm(emptyContactForm);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setContactSending(false);
    }
  };

  const updateContactField = (field: keyof ContactForm, value: string) => {
    setContactSubmitted(false);
    setContactError("");
    setContactForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Portfolio home">
          <span className="wordmark-mark">F<span>/</span></span>
          <span>Portfolio</span>
        </a>
        <button type="button" className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}>
          <a href="#work" onClick={() => setMenuOpen(false)}>Selected work</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#contact-form" onClick={() => setMenuOpen(false)}>Contact <ArrowUpRight size={14} /></a>
        </nav>
        <button type="button" className="theme-toggle" onClick={() => setDarkMode((isDark) => !isDark)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          <span>{darkMode ? "Light" : "Dark"}</span>
        </button>
        <div className="header-status"><span className="presence-dot" /> Open to good work</div>
      </header>

      <main>
        <section className="hero section-pad">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> Independent Full Stack Developer</p>
            <h1>Software that’s built to last.</h1>
            <p className="hero-lede">I’m Utkarsha — I design and build applications end to end, from Design to deployment.</p>
            <div className="hero-actions">
              <a className="button button--lime" href="#work">See the work <ArrowDownRight size={17} /></a>
              <a className="text-link" href="#contact-form">Let’s talk <ArrowUpRight size={15} /></a>
            </div>
          </div>
          <div className="hero-note">
            <div className="hero-note__top"><Sparkles size={17} /><span>Currently</span></div>
            <p>Going deeper on backend: sharpening my skills in Node.js, API design, and database architecture. I’m also exploring the world of AI and how it can be integrated into applications.</p>
            <div className="hero-note__footer"><span>01 / 04</span><span>Scroll to explore ↓</span></div>
          </div>
        </section>

        <section className="intro-strip section-pad" id="about">
          <span className="section-index">01</span>
          <div className="intro-strip__copy">
            <p className="eyebrow">A little context</p>
            <p className="intro-statement"> I like the whole path from idea to deployed product. I’ll sketch the interface, write the backend, and ship it, so what you get is a working thing rather than a hand-off</p>
          </div>
          <div className="intro-facts">
            <div><span>Based in</span><strong>Chhatrapati Sambhajinagar, India · Open to remote</strong></div>
            <div><span>Focus</span><strong>Full stack web · APIs and backend · UI/UX design</strong></div>
             <div><span>Stack</span><strong>Node.js · React · TypeScript · Tailwind · DrizzleORM · PostgreSQL</strong></div>
            <div><span>Elsewhere</span><strong><a href="https://github.com/Utk2345" target="_blank" rel="noreferrer">Github</a></strong></div>
          </div>
        </section>

        {featuredProject && (
          <section className="featured-section section-pad" id="work">
            <div className="section-heading">
              <div><span className="section-index">02</span><p className="eyebrow">Featured work</p></div>
              {CAN_EDIT && <button type="button" className="button button--outline" onClick={openAdd}><Plus size={16} /> Add project</button>}
            </div>
            <article className="featured-card">
              <div className="featured-art">
                {featuredProject.image ? (
                  <img src={featuredProject.image} alt={`${featuredProject.title} preview`} style={coverImageStyle} />
                ) : (
                  <>
                    <div className="featured-art__grid" />
                    <span className="featured-art__label">Case study / {featuredProject.year}</span>
                    <span className="featured-art__index">01</span>
                    <div className="featured-art__circle" style={featuredProject.title.split(" ").some((word) => word.length > 5) ? { fontSize: "clamp(2.2rem, 5vw, 4.6rem)" } : undefined}>
                      <span>{featuredProject.title.split(" ").map((word, i) => <span key={i} style={{ display: "block", transform: "none" }}>{word}</span>)}</span>
                    </div>
                    <div className="featured-art__caption">{featuredProject.tags.join(" · ")}</div>
                  </>
                )}
              </div>
              <div className="featured-card__body">
                <div className="project-card__meta"><span>{featuredProject.category}</span><span>{featuredProject.year}</span></div>
                <h2>{featuredProject.title}</h2>
                <p>{featuredProject.description}</p>
                <div className="tag-list">{featuredProject.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                <div className="featured-card__bottom">
                  <a className="button button--dark" href={featuredProject.liveUrl ?? "#"} target="_blank" rel="noreferrer">View case study <ArrowUpRight size={16} /></a>
                  {CAN_EDIT && <button type="button" className="text-link" onClick={() => openEdit(featuredProject)}>Edit project <Pencil size={14} /></button>}
                </div>
              </div>
            </article>
          </section>
        )}

        <section className="projects-section section-pad">
          <div className="section-heading section-heading--projects">
            <div><span className="section-index">03</span><p className="eyebrow">The rest of the archive</p></div>
            <div className="filter-row" role="tablist" aria-label="Filter projects">
              {categories.map((category) => <button key={category} type="button" className={filter === category ? "filter-button filter-button--active" : "filter-button"} onClick={() => setFilter(category)}>{category}</button>)}
            </div>
          </div>
          {filteredProjects.length > 0 ? (
            <div className="project-grid">
              {filteredProjects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} onEdit={openEdit} onDelete={deleteProject} />)}
            </div>
          ) : (
            <div className="empty-state"><p>No {filter.toLowerCase()} projects yet.</p>{CAN_EDIT && <button type="button" className="text-link" onClick={openAdd}>Add the first one <Plus size={14} /></button>}</div>
          )}
        </section>

        <section className="contact-section section-pad" id="contact">
          <div className="contact-section__mark">F<span>/</span></div>
          <div className="contact-section__copy">
            <p className="eyebrow">Have a thoughtful problem?</p>
            <h2>Let’s make something <em>useful.</em></h2>
            <p className="contact-section__lede">Tell me a little about what you’re working on. I’ll get back to you at the email you leave below.</p>
            <a className="button button--lime contact-section__jump" href="#contact-form">Start a conversation <ArrowDownRight size={16} /></a>
          </div>
          <form className="contact-form" id="contact-form" onSubmit={handleContactSubmit}>
            <div className="contact-form__intro"><span className="eyebrow">03 / Say hello</span><span>Usually replies within 2 days.</span></div>
            <div className="form-grid form-grid--two">
              <label>Name<input value={contactForm.name} onChange={(event) => updateContactField("name", event.target.value)} maxLength={120} placeholder="Your name" required /></label>
              <label>Email<input type="email" value={contactForm.email} onChange={(event) => updateContactField("email", event.target.value)} maxLength={320} placeholder="you@example.com" required /></label>
            </div>
            <label className="hp-field" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={contactForm.website} onChange={(event) => updateContactField("website", event.target.value)} /></label>
            <label>What are you making?<textarea value={contactForm.message} onChange={(event) => updateContactField("message", event.target.value)} minLength={10} maxLength={5000} placeholder="A little context goes a long way..." rows={5} required /></label>
            <div className="contact-form__footer">
              {contactError ? <span className="contact-form__error" role="alert">{contactError}</span> : contactSubmitted ? <span className="contact-form__success" role="status"><Check size={14} /> Thanks! Your message is on its way. I'll reply soon.</span> : <span className="contact-form__note">No pitch deck required.</span>}
              <button className="button button--lime" type="submit" disabled={contactSending}>{contactSending ? "Sending…" : "Send enquiry"} <Mail size={16} /></button>
            </div>
          </form>
        </section>
      </main>

      <footer className="site-footer section-pad">
        <span>© {new Date().getFullYear()} Utkarsha - Portfolio.</span>
        <span>Made with attention, not urgency.</span>
        <div className="footer-links"><a href="https://github.com/Utk2345" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={16} /></a><a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a><a href="#contact-form" aria-label="Contact form"><Mail size={16} /></a></div>
      </footer>

      {CAN_EDIT && <ProjectModal open={modalOpen} mode={modalMode} initialProject={editingProject} onClose={() => setModalOpen(false)} onSave={saveProject} />}
    </div>
  );
}
