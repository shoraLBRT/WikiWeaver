# WikiWeaver

WikiWeaver is an open-source platform for building and managing wiki-style knowledge trees. It supports hierarchical navigation, article authoring with paragraph alternatives, AI-assisted Markdown styling workflows, and an implemented MVP admin panel for content operations.

## Key Features

* **Hierarchical Content Structure**: Organize content using a parent-child tree of nodes.
* **Dynamic Articles**: Attach one article per node with ordered paragraphs.
* **Alternative Content Paths**: Create multiple paragraph variants and choose defaults per paragraph group.
* **Markdown Authoring & Rendering**: Write and view article content in Markdown.
* **AI-Assisted Markdown Styling**: Style article text through configurable AI provider settings (admin-managed).
* **Admin MVP Tools**: Manage nodes/articles/paragraphs and run demo cleanup operations from `/admin`.
* **Extensible Architecture**: Domain-Driven Design (DDD) with clear separation of layers.

## Tech Stack

* **Backend**: ASP.NET Core 8 Minimal API
* **Architecture**: Domain-Driven Design (DDD)
* **Database**: SQLite with Entity Framework Core
* **Frontend**: React + TypeScript + Ant Design
* **Tooling**: AutoMapper, Swagger, Dependency Injection, React Query

## Database

WikiWeaver currently uses **SQLite as the default baseline database** (`wikiweaver.db`, `wikiweaver.dev.db`).

The project intentionally moved away from PostgreSQL for the current MVP phase to keep local setup simple and fast.

## Project Structure

```
WikiWeaver/
├── WikiWeaver.Domain/         # Core domain entities
├── WikiWeaver.Application/    # Services, DTOs, and business logic
├── WikiWeaver.Infrastructure/ # EF Core DbContext, migrations, repositories, seeders
├── WikiWeaver.MinimalApi/     # API endpoints and app bootstrap
├── wikiweaver.react/          # React frontend
└── docs/                      # Plans and engineering guidelines
```

## Getting Started

1. **Run backend**
   ```bash
   dotnet restore
   dotnet build
   dotnet run --project WikiWeaver.MinimalApi
   ```

2. **Run frontend**
   ```bash
   cd wikiweaver.react
   npm install
   npm run dev
   ```

The API applies migrations and seeds demo data on startup. Swagger is available in Development mode.

## Testing Status

* Demo data has been significantly expanded to cover realistic content/navigation flows.
* Seed content includes markdown-rich articles and paragraph alternatives for UI testing.
* Dedicated integration tests for admin authorization and safety checks are planned, but not fully implemented yet.

## Roadmap

* [x] Implement paragraph alternative selection logic
* [x] Add validation and centralized error handling
* [x] Integrate user authentication
* [x] Add React-based frontend for interacting with content
* [x] Add admin panel for moderating content
* [x] Add AI style-supporter for authors
* [x] Add markdown support style articles
* [x] Update design system. Migrate from AntD to Tailwind
* [ ] Add infobox and metadata features
* [ ] Create/edit frontend workflow

## Agent Collaboration

The repository includes agent-focused instructions in:

- `AGENTS.md`
- `docs/agent-guidelines/README.md`
- `docs/agent-guidelines/coding-style.md`
- `docs/agent-guidelines/testing.md`
- `docs/agent-guidelines/commits.md`
- `docs/agent-guidelines/security.md`

These documents define universal development, testing, commit, and security expectations for both human contributors and coding agents.

## Contributing

Contributions are welcome! Please open issues or pull requests to help improve the project.

## License

This project is open-source and available under the [MIT License](LICENSE).
