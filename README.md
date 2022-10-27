# Hyloa
A programming language.

## Notes
These are just temporary notes to myself until I implement them
or create proper documentation.

Required folder structure for a workspace:

```
  |--- projects/
  | |--- project-0/ -- A repository containing source data.
  | | \- (See below.)
  | :
  | \--- project-N/ -- A repository containing source data.
  |   \- (See below.)
  |
  |--- lib/ -- Contains dependencies of the projects.
  | \- (Opaque content, managed by a package manager.)
  |
  |--- programs/ -- Contains compiled programs. (Optional.)
  | |--- program-0/
  | | \- (Content depends on the project/program.)
  | :
  | \--- program-M/
  |   \- ...
  |
  \- (Other optional workspace-specific data.)
```

Required folder structure for a project:

```
  |--- package-0/
  | |- (Content depends on the package)
  | \- package.json / package.hyloa.json
  |
  |--- package-N/
  | \- ...
  |
  \- project.json
```
