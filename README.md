# Portfolio monorepo

Two independent, separately deployable web apps by **Harshith C Shenoy**:

| Project                 | Folder                                        | Description                                                                                           |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Developer portfolio** | [`developer-portfolio/`](developer-portfolio) | Personal site with a detailed Workflow Studio case study and résumé downloads                         |
| **Workflow Studio**     | [`workflow-studio/`](workflow-studio)         | Accessible enterprise approval workflow builder: canvas editor, validation, publishing and simulation |
| Résumé source           | [`resume/`](resume)                           | Generates the ATS-friendly PDF and DOCX                                                               |

Both apps use React, TypeScript, Vite and Tailwind CSS, support Light, Dark and System themes, and include Vitest, Playwright and axe-core test suites. CI runs per project ([`.github/workflows`](.github/workflows)) when that project's folder changes.

Each folder can be split into its own repository without changes:

```bash
git subtree split --prefix=workflow-studio -b workflow-studio-only
```
