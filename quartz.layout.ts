import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.Darkmode(),
    Component.Search(),
  ],
  afterBody: [
    Component.ChatBot({
      title: "Ask SuperBenefit",
      placeholder: "Ask about DAOs, governance, coordination...",
      apiUrl: "https://sb-knowledge-garden-production.up.railway.app",
    }),
  ],
  footer: Component.Footer({
    links: {
      "Twitter": "https://twitter.com/superbenefitdao",
      "Discord": "https://discord.com/invite/d2EeszTvVm",
      "Mirror": "https://superbenefit.mirror.xyz/",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.Description(),
    Component.BannerImage(),
  ],
  left: [
    Component.MobileOnly(Component.Spacer()),
    Component.DesktopOnly(Component.Explorer({
      title: "Knowledge Garden", // title of the explorer component
    })),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle()],
  left: [
    Component.MobileOnly(Component.Spacer()),
    Component.DesktopOnly(Component.Explorer({
      title: "Knowledge Garden", // title of the explorer component
    })),
  ],
  right: [],
}
