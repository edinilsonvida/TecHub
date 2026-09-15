import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./NewProjectPage.css";


const MOCK_COLLABORATORS = [
{ id: 1, name: "Antoni Ferraz", color: "#3a5a8a" },
{ id: 2, name: "Gabriela Rodrigues", color: "#8a3a5a" },
{ id: 3, name: "Marcio Zunique", color: "#555" },
{ id: 4, name: "Lucas Mendes", color: "#4a7a5a" },
];

const STATUS_OPTIONS = [
"Em design",
"Em desenvolvimento",
"Concluído",
"Pausado",
];

const RULES = [
"O rascunho salvo fica visível para você e os colaboradores.",
"Os colaboradores também podem editar o projeto.",
"Só o dono pode excluir o projeto.",
];

function isValidUrl(value) {
try {
const { protocol } = new URL(value);
return protocol === "http:" || protocol === "https:";
} catch {
return false;
}
}

function validateForm(form) {
const errors = {};

if (!form.title.trim()) {
errors.title = "O título é obrigatório.";
} else if (form.title.trim().length < 3) {
errors.title = "Informe pelo menos 3 caracteres.";
}

if (!form.description.trim()) {
errors.description = "Descreva o projeto antes de enviar.";
}

if (form.tags.length === 0) {
errors.tags = "Adicione pelo menos uma tag.";
}

if (form.github && !isValidUrl(form.github)) {
errors.github = "Informe uma URL válida, começando com https://.";
}

if (form.liveUrl && !isValidUrl(form.liveUrl)) {
errors.liveUrl = "Informe uma URL válida, começando com https://.";
}

return errors;
}

export default function NewProjectPage() {
const navigate = useNavigate();

const [title, setTitle] = useState("");
const [description, setDescription] = useState("");

const [tagInput, setTagInput] = useState("");
const [tags, setTags] = useState(["Web", "Front-end"]);

const [collaboratorInput, setCollaboratorInput] = useState("");
const [collaborators, setCollaborators] = useState([MOCK_COLLABORATORS[0]]);

const [github, setGithub] = useState("");
const [liveUrl, setLiveUrl] = useState("");

const [status, setStatus] = useState("Em design");

const [files, setFiles] = useState([]);
const [dragOver, setDragOver] = useState(false);

const [errors, setErrors] = useState({});
const [successMessage, setSuccessMessage] = useState("");

// Colaboradores que ainda não foram adicionados, filtrados pela busca.
const search = collaboratorInput.trim().toLowerCase();
const suggestions = search
? MOCK_COLLABORATORS.filter(
    (person) =>
      person.name.toLowerCase().includes(search) &&
      !collaborators.some((added) => added.id === person.id)
  )
: [];

function handleTagKeyDown(e) {
if (e.key === "Enter") {
e.preventDefault();

  const newTag = tagInput.trim();

  if (newTag && !tags.includes(newTag)) {
    setTags([...tags, newTag]);
    setTagInput("");
  }
}

}

function removeTag(tagToRemove) {
setTags(tags.filter((tag) => tag !== tagToRemove));
}

function addCollaborator(person) {
setCollaborators([...collaborators, person]);
setCollaboratorInput("");
}

function removeCollaborator(id) {
setCollaborators(collaborators.filter((person) => person.id !== id));
}

function addFiles(fileList) {
const incoming = Array.from(fileList);

if (incoming.length > 0) {
  setFiles([...files, ...incoming]);
}
}

function removeFile(position) {
setFiles(files.filter((file, index) => index !== position));
}

function handleDragOver(e) {
e.preventDefault();
setDragOver(true);
}

function handleDragLeave() {
setDragOver(false);
}

function handleDrop(e) {
e.preventDefault();
setDragOver(false);
addFiles(e.dataTransfer.files);
}

function handleSubmit(e) {
e.preventDefault();

const validationErrors = validateForm({ title, description, tags, github, liveUrl });
setErrors(validationErrors);

if (Object.keys(validationErrors).length > 0) {
  setSuccessMessage("");
  return;
}

setSuccessMessage(
  "Projeto validado com sucesso! O envio para revisão será integrado em uma próxima Sprint."
);
}

return (
<main className="new-project-page">
<h1 className="new-project-title">
Novo projeto
</h1>

  <form className="new-project-card" onSubmit={handleSubmit} noValidate>
    {/* Título */}
    <div className="form-field">
      <label className="form-label">
        <div> Título<span className="required">*</span> </div>
      </label>

      <input
        type="text"
        maxLength={100}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="project-input"
        placeholder="Digite o título do projeto"
      />

      <span className="input-counter">
        {title.length}/100
      </span>

      {errors.title && (
        <span className="field-error">{errors.title}</span>
      )}
    </div>

    {/* Descrição */}
    <div className="form-field">
      <label className="form-label">
        Descrição do projeto
      </label>

      <div className="description-container">
        <div className="project-toolbar">
          <button
            type="button"
            title="Negrito"
            className="project-toolbar-button"
          >
            <i className="fa-solid fa-bold project-toolbar-icon" title="Negrito" aria-hidden="true" />
          </button>

          <button
            type="button"
            title="Itálico"
            className="project-toolbar-button"
          >
            <i className="fa-solid fa-italic project-toolbar-icon" title="Itálico" aria-hidden="true" />
          </button>

          <button
            type="button"
            title="Lista"
            className="project-toolbar-button"
          >
            <i className="fa-solid fa-list project-toolbar-icon" title="Lista" aria-hidden="true" />
          </button>

          <button
            type="button"
            title="Link"
            className="project-toolbar-button"
          >
            <i className="fa-solid fa-link project-toolbar-icon" title="Link" aria-hidden="true" />
          </button>
        </div>

        <textarea
          maxLength={3000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="description-textarea"
          placeholder="Descreva seu projeto..."
        />
      </div>

      <span className="description-counter">
        {description.length}/3000
      </span>

      {errors.description && (
        <span className="field-error">{errors.description}</span>
      )}
    </div>

    {/* Tags */}
    <div className="form-field">
      <label className="form-label">
        Tags
      </label>

      <div className="tags-container">
        <div className="tags-search">
          <i className="fa-solid fa-tag toolbar-icon" title="Tags" aria-hidden="true" />

          <input
            type="text"
            placeholder="Digite para buscar tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="tags-input"
          />
        </div>

        {tags.length > 0 && (
          <div className="selected-tags">
            {tags.map((tag) => (
              <span
                key={tag}
                className="tag"
              >
                {tag}

                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="tag-remove-button"
                  title={`Remover ${tag}`}
                >
                  <i className="fa-solid fa-xmark tag-remove-icon" title="Remover" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {errors.tags && (
        <span className="field-error">{errors.tags}</span>
      )}
    </div>

    {/* Colaboradores */}
    <div className="form-field">
      <label className="form-label">
        Colaboradores
      </label>

      <div className="tags-container">
        <div className="tags-search">
          <svg
            className="tag-outline-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
        <path d="M4 4h7.5L20 12.5 12.5 20 4 11.5V4Z" />
        <circle cx="8" cy="8" r="1.2" />
        </svg>

          <input
            type="text"
            placeholder="Pesquisar colaborador"
            value={collaboratorInput}
            onChange={(e) => setCollaboratorInput(e.target.value)}
            className="tags-input"
          />
        </div>

        {search && (
          <ul className="collaborator-suggestions">
            {suggestions.length > 0 ? (
              suggestions.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    className="collaborator-suggestion"
                    onClick={() => addCollaborator(person)}
                  >
                    <span
                      className="collaborator-suggestion-avatar"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.name.charAt(0)}
                    </span>
                    {person.name}
                  </button>
                </li>
              ))
            ) : (
              <li className="collaborator-empty">Nenhum colaborador encontrado.</li>
            )}
          </ul>
        )}

        {collaborators.length > 0 && (
          <div className="collaborators-grid">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="collaborator-card"
              >
                <button
                  type="button"
                  title={`Remover ${collaborator.name}`}
                  onClick={() => removeCollaborator(collaborator.id)}
                  className="collaborator-remove-button"
                >
                  <i className="fa-solid fa-xmark collaborator-remove-icon" title="Remover" aria-hidden="true" />
                </button>

                <div
                  className="collaborator-avatar"
                  style={{
                    backgroundColor: collaborator.color,
                  }}
                >
                  {collaborator.name.charAt(0)}
                </div>

                <span className="collaborator-name">
                  {collaborator.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ul className="collaborator-rules">
        {RULES.map((rule) => (
          <li key={rule}>
            {rule}
          </li>
        ))}
      </ul>
    </div>

    {/* Links externos */}
    <div className="external-links">
      <div className="external-link-field">
        <GithubIcon />

        <input
          type="url"
          placeholder="https://github.com/usuario/repositorio"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          className="project-input"
        />
      </div>

      {errors.github && (
        <span className="field-error">{errors.github}</span>
      )}

      <div className="external-link-field">
        <ExternalLinkIcon />

        <input
          type="url"
          placeholder="Link para demonstração"
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          className="project-input"
        />
      </div>

      {errors.liveUrl && (
        <span className="field-error">{errors.liveUrl}</span>
      )}
    </div>

    {/* Upload */}
    <label
      className={`upload-area ${dragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        className="upload-input"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <i className="fa-solid fa-plus upload-icon" title="Adicionar" aria-hidden="true" />

      <div className="upload-text">
        <p className="upload-title">
          Adicionar fotos / vídeos
        </p>

        <p className="upload-helper">
          Ou arraste e solte arquivos aqui
        </p>
      </div>
    </label>

    {files.length > 0 && (
      <ul className="upload-file-list">
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`} className="upload-file">
            <i className="fa-solid fa-paperclip" aria-hidden="true" />
            <span className="upload-file-name">{file.name}</span>
            <button
              type="button"
              className="upload-file-remove"
              onClick={() => removeFile(index)}
              title={`Remover ${file.name}`}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    )}

    {/* Status */}
    <div className="status-section">
      <label className="form-label">
        Status
      </label>

      <div className="status-options">
        {STATUS_OPTIONS.map((option) => {
          const active = status === option;

          return (
            <button
              type="button"
              key={option}
              onClick={() => setStatus(option)}
              className={`status-button ${
                active ? "active" : ""
              }`}
            >
              <span className="status-radio">
                {active && (
                  <span className="status-radio-inner" />
                )}
              </span>

              {option}
            </button>
          );
        })}
      </div>
    </div>
    {successMessage && (
      <p className="form-success" role="status">
        {successMessage}
      </p>
    )}

    {/* Ações */}
    <div className="actions">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="action-button save-draft"
      >
        Salvar rascunho
      </button>

      <button
        type="submit"
        className="action-button submit-review"
      >
        Enviar para revisão
      </button>
    </div>
  </form>
</main>

);
}

function GithubIcon() {
return (
<svg className="external-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" >
<path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
</svg>
);
}

function ExternalLinkIcon() {
return (
<svg className="external-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" >
<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />

  <path
    d="M15 3h6v6M10 14L21 3"
  />
</svg>

);
}