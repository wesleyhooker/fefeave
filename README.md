# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Deployment Flow

```mermaid
flowchart TD
    Dev[Developer] -->|push to main| GitHub
    GitHub --> Actions[GitHub Actions CI/CD]
    Actions -->|OIDC AssumeRole| IAM[AWS IAM Role]
    IAM --> S3[S3 Bucket (fefeave-frontend-dev)]
    S3 --> CF[CloudFront Distribution]
    CF --> User[End Users]

### Terraform File Map

```mermaid
flowchart TD
    subgraph DIR[infra/dev/]
        P[providers.tf<br/>• AWS provider (us-west-2)]
        S3F[s3.tf<br/>• S3 bucket<br/>• SPA website config]
        CF[cloudfront.tf<br/>• CloudFront distro<br/>• OAC]
        POL[s3_policy.tf<br/>• Bucket policy -> CF SourceArn]
        IAM[iam_gh_oidc.tf<br/>• GitHub OIDC provider<br/>• OIDC deploy role<br/>• Least-priv policy]
        OUT[outputs.tf<br/>• CF distribution ID<br/>• S3 bucket name<br/>• OIDC role ARN]
        M[main.tf<br/>• header / table of contents]
    end

    P --> S3F
    P --> CF
    P --> IAM
    S3F --> POL
    CF --> POL
    S3F --> OUT
    CF --> OUT
    IAM --> OUT


---

## 2) Terraform files → AWS resources (end-to-end)

```markdown
### Terraform to AWS Resource Map

```mermaid
flowchart LR
    subgraph TF[Terraform Files]
      P[providers.tf]
      S3F[s3.tf]
      CF[cloudfront.tf]
      POL[s3_policy.tf]
      IAM[iam_gh_oidc.tf]
      OUT[outputs.tf]
    end

    subgraph AWS[AWS Resources]
      S3[(S3: fefeave-frontend-dev)]
      OAC[[CloudFront OAC]]
      CFD[(CloudFront Distribution)]
      POLA[[S3 Bucket Policy]]
      ROLE[(IAM Role: fefeave-frontend-deploy)]
      OIDC[[IAM OIDC Provider (GitHub)]]
    end

    S3F --> S3
    CF --> OAC
    CF --> CFD
    POL --> POLA
    POLA --- S3
    POLA --- CFD
    IAM --> ROLE
    IAM --> OIDC
    OUT -->|exposes IDs| CFD
    OUT -->|exposes names| S3
    OUT -->|exposes ARN| ROLE


---

## 3) (Optional) CI/CD + Terraform apply workflow

```markdown
### CI/CD Workflow (High Level)

```mermaid
flowchart TD
    Dev[Developer] -->|push to main| GH[GitHub]
    GH --> GA[GitHub Actions]
    GA -->|OIDC AssumeRole| IAM[AWS IAM Role]
    GA --> Build[Angular Build<br/>dist/<app>]
    IAM --> S3[(S3 Upload)]
    S3 --> CF[(CloudFront)]
    GA --> Plan[terraform plan (optional gate)]
    Plan --> Approve[Manual approval] --> Apply[terraform apply]
    Apply --> AWS[Create/Update Infra]
    CF --> Users[End Users]
