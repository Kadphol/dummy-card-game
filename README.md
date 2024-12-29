# Next.js 15+ + Tailwind CSS 3+ + TypeScript Starter

## ⚡ next-seed-template

**Next.js + Tailwind CSS + TypeScript starter with developer tools.**

### Features

Developer experience first tools only without UI boilerplate:

- 🔋 [Next.js](https://nextjs.org) with App Router support
- 📘 Type checking [TypeScript](https://www.typescriptlang.org)
- 💄 Integrate with [Tailwind CSS](https://tailwindcss.com)
- ⚛️  [React](https://react.dev/) 18 with Strict mode
- 📏 Linter with [ESLint](https://eslint.org)
- 🚀 Code Formatter with [Prettier](https://prettier.io)
- 🐶 [Husky](https://typicode.github.io/husky/) for Git Hooks script
- 📐 [Lint-staged](https://github.com/lint-staged/lint-staged) for running linters and formatter on Git staged files
- 👀 Lint git commit with [Commitlint](https://commitlint.js.org/)
- ⚙️  Consistent coding styles across editors and IDEs with [EditorConfig](https://editorconfig.org/)
- 🃏 Unit Testing with [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- <img src="https://github.com/mswjs/msw/blob/main/media/msw-logo.svg?raw=true" width="16" alt="Mock Service Worker logo" /> API Mock with [MSW v2](https://mswjs.io)

### Requirements

- Node.js 20+ and pnpm

### Use this template

```shell
npx degit Kadphol/next-seed-template <APP NAME>
```

or using with Create next app

```shell
npx create-next-app --example https://github.com/Kadphol/next-seed-template <YOUR_APP_NAME>
```

### Getting started

Run the following command on your local environment:

```shell
git clone --depth=1 https://github.com/Kadphol/next-seed-template.git my-project-name
cd my-project-name
pnpm install
```

To run development mode:

```shell
pnpm dev
```

Open <http://localhost:3000> with your favorite browser to see your project.


### Project structure

```shell
.
├── README.md                       # README file
├── .github                         # GitHub folder
├── .gitlab                         # GitLab folder
├── .husky                          # Husky configuration
├── public                          # Public assets folder
├── src
│   ├── app                         # Next JS App (App Router)
│   ├── components                  # Shared components folder
│   ├── libs                        # Library and utility function folder
│   ├── mocks                       # Mock data and server folder
│   ├── modules                     # Modules components folder
│   ├── styles                      # Styles folder
│   └── types                       # Type definitions
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── jest.config.ts                  # Jest configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── Dockerfile                      # Dockerfile
└── tsconfig.json                   # TypeScript configuration
```
