# Codexa Blocks

**Bring your next page idea to life, right in the WordPress block editor.**

Codexa Blocks gives you customizable Gutenberg blocks for building polished, responsive WordPress pages. Create flexible column layouts, organize content with accordions and tabs, showcase images and posts, and draw attention to your calls to action, all in the editor you already use.

Start with your theme's design, then make it your own. Adjust layouts and styles for desktop, tablet and mobile, with controls for the details that make a page feel complete. Build a business homepage, a campaign landing page, a portfolio or a content-rich resource page with blocks designed to work together.

**[Install Codexa Blocks](https://wordpress.org/plugins/codexa-blocks/) · [Read the documentation](https://codexalogic.com/documentation/) · [Get support](https://wordpress.org/support/plugin/codexa-blocks/)**

This repository holds the readable source. To use the plugin on your site, install it from WordPress.org.

## More creative control, one familiar editor

- **Shape your layout visually.** Drag to resize columns, choose how many sit side by side on each device, reverse their order on smaller screens, and give them equal height.
- **Make every screen count.** Set spacing, alignment, layouts and visibility for desktop, tablet and mobile.
- **Keep your design consistent.** Use your theme's color, font size and corner radius presets. Headings keep your theme's styles until you change them.
- **Give content room to breathe.** Turn long sections into accordions or tabs, build image galleries, and show recent posts as cards.
- **Add the finishing touches.** Use icons, animated numbers, video backgrounds and shape dividers to give pages personality.
- **Build with accessibility in mind.** Accordions use the browser's own disclosure element, and tabs follow the WAI-ARIA tabs pattern.

## Blocks

Every block is included in the free plugin.

| Block              | What you can create                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Row and Column** | Page sections with columns you resize by dragging. Set how columns stack on each device, reverse their order and give them equal height. Add backgrounds, video and shape dividers, or make a whole column a link. |
| **Accordion**      | FAQs and expandable content that keep long pages easy to scan, built on the browser's own disclosure element, with an option to keep one section open at a time.                                                   |
| **Tabs**           | Related content in tabs across the top or down the side. Link visitors straight to a specific tab, with keyboard support that follows the WAI-ARIA tabs pattern.                                                   |
| **Buttons**        | Calls to action in fill, outline, text link and underline styles, with icons in outline and solid.                                                                                                                 |
| **Icon List**      | Feature lists, service highlights and benefits with an icon for each item, in columns or side by side, with dividers.                                                                                              |
| **Advanced Text**  | Paragraphs and headings with an icon on the left or right, their own typography, colors, background and border, spacing and alignment for each device, and an optional link.                                       |
| **Count Up**       | Animated statistics and milestones, with a prefix, suffix and your choice of separators.                                                                                                                           |
| **Gallery**        | Grid or masonry galleries for portfolios and projects, with captions, links and a lightbox.                                                                                                                        |
| **Posts**          | Recent posts or pages as cards, filtered by category or tag.                                                                                                                                                       |

## Designed to belong on your site

Codexa Blocks follows your theme first. Its controls offer your theme's presets for colors, font sizes and corner radius, so pages stay consistent. Keep the styles you have, or customize a block when a section needs something different. The five colors every block starts with are set once under **Codexa Blocks > Colors**.

## Take your blocks further with Pro

Codexa Blocks Pro adds category filters and a Load more button to the Gallery block, filters to the Posts block, your own SVG icons for buttons, icon lists and text, any post type in the Posts block with a Load more button and infinite scroll, custom shadows, and more shape dividers with a gentle drift. Pro needs Codexa Blocks installed and active, and every block above stays free.

## Requirements

| To use the plugin      | To build it from source               |
| ---------------------- | ------------------------------------- |
| WordPress 6.7 or later | Node.js 24.18 or later (see `.nvmrc`) |
| PHP 8.0 or later       | npm 11.16 or later                    |
|                        | PHP 8.0 or later and Composer         |

## Installation

1. In your dashboard, go to **Plugins > Add New Plugin** and search for **Codexa Blocks**.
2. Click **Install Now**, then **Activate**.
3. Open a page or post in the block editor and find the blocks under **Codexa Blocks** in the inserter.

## Frequently asked questions

### Do I need Pro to use the blocks listed here?

No. Row and Column, Accordion, Tabs, Buttons, Icon List, Advanced Text, Count Up, Gallery and Posts are all in the free plugin.

### Can I change layouts for mobile?

Yes. Switch the editor to Tablet or Mobile and change any setting that has a device switcher. A device without its own value follows the next larger one.

### Will the blocks use my theme's styles?

Yes. They offer your theme's presets for colors, font sizes and corner radius, and headings keep your theme's styles unless you change them.

### Can I upload my own icons?

The free plugin includes the Codexa icons, in outline and solid. Uploading your own SVG icons comes with Codexa Blocks Pro.

### Can visitors load more posts without leaving the page?

The free Posts block shows the number of posts you choose. Pro adds a Load more button and infinite scroll, with a limit on automatic loads so visitors can still reach the footer. Pro also lets the block show any public post type, such as portfolios or events.

## Building from source

```bash
git clone https://github.com/CodexaLogic/codexa-blocks.git
cd codexa-blocks
npm install
composer install
npm run build
```

Clone it into `wp-content/plugins` so the folder is named `codexa-blocks`, then activate **Codexa Blocks** in the dashboard.

For a ready-made test site, `.wp-env.json` sets up WordPress with debugging on and [Plugin Check](https://wordpress.org/plugins/plugin-check/) installed. Run `npx wp-env start` with Docker running.

## Scripts

| Command                | What it does                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Builds everything and rebuilds as you edit                                                                                    |
| `npm run build`        | Builds the blocks, editor, admin pages and shared styles into `build/`, with a direct-access check in each PHP file it writes |
| `npm run lint`         | Runs ESLint, Stylelint and PHP_CodeSniffer (WordPress standards, PHP 8.0 compatibility)                                       |
| `npm run lint:fix`     | Fixes what the linters can fix on their own                                                                                   |
| `npm run format:check` | Checks formatting with Prettier. `npm run format` fixes it.                                                                   |
| `npm run pot`          | Writes `languages/codexa-blocks.pot`. Needs an internet connection.                                                           |
| `npm run bundle`       | Builds, writes the translation template, checks the files and packs `packaged/codexa-blocks-<version>.zip` for WordPress.org  |

## Project layout

```text
codexa-blocks.php    Plugin header and bootstrap
includes/              PHP, autoloaded under the CodexaBlocks namespace (PSR-4)
src/blocks/            One folder per block, with block.json, edit and styles
src/editor/            Shared editor code, loaded once as @codexa-blocks/editor
src/admin/             The Colors page
src/common/            Front-end styles and scripts shared by the blocks
src/shared/            Components, hooks and utilities the blocks import
src/icons/             The Codexa icon set, outline and solid
scripts/               Build, translation and packaging scripts
```

`build/` is generated and isn't committed. `.distignore` lists what stays out of the plugin zip.

## Extending

Other plugins can extend Codexa Blocks through these hooks.

| Hook                              | Type   | Use it to                                                                     |
| --------------------------------- | ------ | ----------------------------------------------------------------------------- |
| `codexa_blocks/loaded`            | Action | Start an add-on once Codexa Blocks has loaded. It passes the running version. |
| `codexa_blocks/register_blocks`   | Action | Register an add-on's compiled blocks alongside the plugin's own               |
| `codexa_blocks/admin_menu`        | Action | Run code after the Codexa Blocks menu is added                                |
| `codexa_blocks/admin_pages`       | Filter | Add pages to the Codexa Blocks menu, each with its own tab                    |
| `codexa_blocks/admin_links`       | Filter | Change the help links on the Overview page                                    |
| `codexa_blocks/count_up/settings` | Filter | Change a counter's number settings. The result is validated again.            |

## Support and bug reports

Ask questions and report bugs in the [support forum](https://wordpress.org/support/plugin/codexa-blocks/) on WordPress.org. Include the system check from **Codexa Blocks > Overview**, the steps that cause the problem, and your theme.

Guides for each block are in the [documentation](https://codexalogic.com/documentation/).

## License

GPLv2 or later. See [LICENSE](LICENSE).
