# WikiWeaver

WikiWeaver is a flexible and extensible open-source platform for building, structuring, and collaborating on wiki-style content. It allows users to organize content into a hierarchical structure, manage articles with multiple paragraph variations, and create knowledge-based systems with precision and clarity.

## Key Features

* **Hierarchical Content Structure**: Organize content using a parent-child tree of nodes.
* **Dynamic Articles**: Attach one article per node with ordered paragraphs.
* **Alternative Content Paths**: Support for alternative paragraphs within articles to reflect different viewpoints or contexts.
* **Extensible Architecture**: Built using Domain-Driven Design (DDD), allowing clean separation of layers and easy maintainability.
* **Entity Mappings & Persistence**: Entity Framework Core with PostgreSQL for reliable data storage.
* **API-First Approach**: REST API built on ASP.NET Core Minimal API, ready for frontend onboarding.
* **Front-End Flexibility**: Designed to integrate seamlessly with modern front-end frameworks like React.

## Tech Stack

* **Backend**: ASP.NET Core 8 Minimal API
* **Architecture**: Domain-Driven Design (DDD)
* **Database**: PostgreSQL with Entity Framework Core
* **Frontend**: React (planned)
* **Tooling**: AutoMapper, Swagger, Dependency Injection, FluentValidation (planned)

## Project Structure

```
WikiWeaver/
├── WikiWeaver.Domain/         # Core Domain Entities & Interfaces
├── WikiWeaver.Application/    # Services, DTOs, and business logic
├── WikiWeaver.Infrastructure/ # EF Core DbContext, Repositories
└── WikiWeaver.MinimalApi/     # API Endpoints & Application Bootstrap
```

## Getting Started

Currently under active development. The API is partially complete and provides basic CRUD operations for Nodes, Articles, and Paragraphs.

You can interact with the API via Swagger UI once the application is running. The frontend is planned for future implementation.

## Roadmap

* [ ] Implement paragraph alternative selection logic
* [ ] Add validation and centralized error handling
* [ ] Integrate user authentication
* [ ] Add full React-based frontend for interacting with content
* [ ] Deploy using Docker and CI/CD pipeline

## Contributing

Contributions are welcome! Please open issues or pull requests to help improve the project.

## License

This project is open-source and available under the [MIT License](LICENSE).
