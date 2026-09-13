import { aboutPage } from "./pages/about.js";
import { contactPage } from "./pages/contact.js";
import { privacyPage } from "./pages/privacy-policy.js";
import { termsPage } from "./pages/terms.js";
import { disclaimerPage } from "./pages/disclaimer.js";

export default {
  async fetch(request, env, ctx) {

    const url = new URL(request.url);

    switch (url.pathname) {

      case "/about":
      case "/about/":
        return html(aboutPage());

      case "/contact":
      case "/contact/":
        return html(contactPage());

      case "/privacy-policy":
      case "/privacy-policy/":
        return html(privacyPage());

      case "/terms":
      case "/terms/":
        return html(termsPage());

      case "/disclaimer":
      case "/disclaimer/":
        return html(disclaimerPage());

      default:
        return new Response("Not Found", {
          status: 404,
          headers: {
            "content-type": "text/plain;charset=UTF-8"
          }
        });
    }
  }
};

function html(content) {
  return new Response(content, {
    status: 200,
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "public, max-age=3600"
    }
  });
}
