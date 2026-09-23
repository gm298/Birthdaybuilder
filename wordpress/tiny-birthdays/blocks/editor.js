(function (wp) {
  "use strict";

  var el = wp.element.createElement;
  var Fragment = wp.element.Fragment;
  var registerBlockType = wp.blocks.registerBlockType;
  var InspectorControls = wp.blockEditor.InspectorControls;
  var MediaUpload = wp.blockEditor.MediaUpload;
  var MediaUploadCheck = wp.blockEditor.MediaUploadCheck;
  var PanelBody = wp.components.PanelBody;
  var TextControl = wp.components.TextControl;
  var TextareaControl = wp.components.TextareaControl;
  var ToggleControl = wp.components.ToggleControl;
  var Button = wp.components.Button;
  var Notice = wp.components.Notice;
  var ServerSideRender = wp.serverSideRender;

  var cfg = window.tinyBirthdaysEditor || { assets: {}, urls: {}, waTasting: "", waQuestion: "", googleReviews: "" };
  var birthdaysImg = (cfg.assets && cfg.assets.birthdays) || "";

  function text(label, key, props, help) {
    return el(TextControl, {
      label: label,
      help: help || "",
      value: props.attributes[key] || "",
      onChange: function (value) {
        var next = {};
        next[key] = value;
        props.setAttributes(next);
      },
    });
  }

  function area(label, key, props, help) {
    return el(TextareaControl, {
      label: label,
      help: help || "",
      value: props.attributes[key] || "",
      onChange: function (value) {
        var next = {};
        next[key] = value;
        props.setAttributes(next);
      },
    });
  }

  function linesToList(value) {
    return String(value || "")
      .split("\n")
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean);
  }

  function listToLines(list) {
    return (list || []).join("\n");
  }

  function listArea(label, key, props, help) {
    return el(TextareaControl, {
      label: label,
      help: help || "One item per line",
      value: listToLines(props.attributes[key]),
      onChange: function (value) {
        var next = {};
        next[key] = linesToList(value);
        props.setAttributes(next);
      },
    });
  }

  function mediaButton(label, key, props) {
    return el(MediaUploadCheck, {},
      el(MediaUpload, {
        onSelect: function (media) {
          var next = {};
          next[key] = media && media.url ? media.url : "";
          props.setAttributes(next);
        },
        allowedTypes: ["image", "video"],
        render: function (obj) {
          return el(Button, { variant: "secondary", onClick: obj.open }, label);
        },
      })
    );
  }

  function preview(name, props) {
    return el("div", { className: "tiny-edit-panel" },
      el(ServerSideRender, { block: name, attributes: props.attributes })
    );
  }

  function appNote(title, body) {
    return el("div", { className: "tiny-block-note" },
      el("strong", null, title),
      el("p", null, body)
    );
  }

  registerBlockType("tiny/hero", {
    apiVersion: 3,
    title: "Tiny Hero",
    icon: "cover-image",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Hero copy", initialOpen: true },
            text("Eyebrow", "eyebrow", props),
            area("Headline (use <br> for line breaks)", "headline", props),
            area("Subheading", "sub", props),
            listArea("Checklist", "checks", props),
            text("Primary button", "primaryLabel", props),
            text("Primary URL", "primaryUrl", props),
            text("Secondary button", "secondaryLabel", props),
            text("Secondary URL", "secondaryUrl", props),
            text("Note", "note", props),
            text("Rating line", "rating", props)
          ),
          el(PanelBody, { title: "Media", initialOpen: false },
            text("Poster image URL", "poster", props),
            mediaButton("Replace poster", "poster", props),
            text("Video URL", "video", props),
            text("Logo URL", "logo", props)
          )
        ),
        preview("tiny/hero", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/included", {
    apiVersion: 3,
    title: "Tiny Included",
    icon: "yes-alt",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Offer copy", initialOpen: true },
            text("Eyebrow", "eyebrow", props),
            area("Headline", "headline", props),
            area("Lead", "lead", props),
            listArea("Included list", "items", props),
            listArea("Mobile list", "itemsMobile", props),
            text("Card title", "cardTitle", props),
            listArea("Steps", "steps", props),
            text("Card footer", "footer", props),
            text("Background image URL", "background", props),
            mediaButton("Replace background", "background", props)
          )
        ),
        preview("tiny/included", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/gallery", {
    apiVersion: 3,
    title: "Tiny Gallery",
    icon: "format-gallery",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      var images = props.attributes.images || [];
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Photos", initialOpen: true },
            images.map(function (image, index) {
              return el("div", { key: index, className: "tiny-repeat__row" },
                el(TextControl, {
                  label: "Image " + (index + 1) + " URL",
                  value: image.url || "",
                  onChange: function (value) {
                    var next = images.slice();
                    next[index] = Object.assign({}, image, { url: value });
                    props.setAttributes({ images: next });
                  },
                }),
                el(TextControl, {
                  label: "Alt text",
                  value: image.alt || "",
                  onChange: function (value) {
                    var next = images.slice();
                    next[index] = Object.assign({}, image, { alt: value });
                    props.setAttributes({ images: next });
                  },
                }),
                el(MediaUploadCheck, {},
                  el(MediaUpload, {
                    onSelect: function (media) {
                      var next = images.slice();
                      next[index] = Object.assign({}, image, {
                        url: media.url,
                        alt: media.alt || image.alt || "",
                      });
                      props.setAttributes({ images: next });
                    },
                    allowedTypes: ["image"],
                    render: function (obj) {
                      return el(Button, { variant: "secondary", onClick: obj.open }, "Replace photo");
                    },
                  })
                )
              );
            })
          )
        ),
        preview("tiny/gallery", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/reviews", {
    apiVersion: 3,
    title: "Tiny Reviews",
    icon: "star-filled",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      var items = props.attributes.items || [];
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Reviews", initialOpen: true },
            text("Headline", "headline", props),
            text("Google label", "googleLabel", props),
            text("Google URL", "googleUrl", props),
            items.map(function (item, index) {
              return el("div", { key: index, className: "tiny-repeat__row" },
                el(TextareaControl, {
                  label: "Quote " + (index + 1),
                  value: item.quote || "",
                  onChange: function (value) {
                    var next = items.slice();
                    next[index] = Object.assign({}, item, { quote: value });
                    props.setAttributes({ items: next });
                  },
                }),
                el(TextControl, {
                  label: "Attribution",
                  value: item.by || "",
                  onChange: function (value) {
                    var next = items.slice();
                    next[index] = Object.assign({}, item, { by: value });
                    props.setAttributes({ items: next });
                  },
                }),
                el(ToggleControl, {
                  label: "Hide on mobile",
                  checked: !!item.hideMobile,
                  onChange: function (value) {
                    var next = items.slice();
                    next[index] = Object.assign({}, item, { hideMobile: value });
                    props.setAttributes({ items: next });
                  },
                })
              );
            })
          )
        ),
        preview("tiny/reviews", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/packages", {
    apiVersion: 3,
    title: "Tiny Packages",
    icon: "products",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      var packages = props.attributes.packages || [];
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Section", initialOpen: true },
            el(Notice, { status: "warning", isDismissible: false },
              "These cards are marketing copy only. Party builder prices still come from party.json / Supabase."
            ),
            text("Eyebrow", "eyebrow", props),
            text("Headline", "headline", props),
            area("Note", "note", props),
            area("Legal", "legal", props),
            area("Legal (mobile)", "legalMobile", props),
            text("Card CTA", "cta", props)
          ),
          el(PanelBody, { title: "Packages", initialOpen: false },
            packages.map(function (pkg, index) {
              return el("div", { key: pkg.id || index, className: "tiny-repeat__row" },
                el(TextControl, {
                  label: "Name",
                  value: pkg.name || "",
                  onChange: function (value) {
                    var next = packages.slice();
                    next[index] = Object.assign({}, pkg, { name: value });
                    props.setAttributes({ packages: next });
                  },
                }),
                el(TextControl, {
                  label: "Short name",
                  value: pkg.shortName || "",
                  onChange: function (value) {
                    var next = packages.slice();
                    next[index] = Object.assign({}, pkg, { shortName: value });
                    props.setAttributes({ packages: next });
                  },
                }),
                el(TextControl, {
                  label: "Guests",
                  value: pkg.guests || "",
                  onChange: function (value) {
                    var next = packages.slice();
                    next[index] = Object.assign({}, pkg, { guests: value });
                    props.setAttributes({ packages: next });
                  },
                }),
                el(TextControl, {
                  label: "Price",
                  value: pkg.price || "",
                  onChange: function (value) {
                    var next = packages.slice();
                    next[index] = Object.assign({}, pkg, { price: value });
                    props.setAttributes({ packages: next });
                  },
                }),
                el(TextareaControl, {
                  label: "Features (one per line)",
                  value: listToLines(pkg.features),
                  onChange: function (value) {
                    var next = packages.slice();
                    next[index] = Object.assign({}, pkg, { features: linesToList(value) });
                    props.setAttributes({ packages: next });
                  },
                }),
                el(TextControl, {
                  label: "Mobile summary",
                  value: pkg.mobileSummary || "",
                  onChange: function (value) {
                    var next = packages.slice();
                    next[index] = Object.assign({}, pkg, { mobileSummary: value });
                    props.setAttributes({ packages: next });
                  },
                }),
                el(ToggleControl, {
                  label: "Most popular",
                  checked: !!pkg.featured,
                  onChange: function (value) {
                    var next = packages.slice();
                    next[index] = Object.assign({}, pkg, { featured: value });
                    props.setAttributes({ packages: next });
                  },
                })
              );
            })
          )
        ),
        preview("tiny/packages", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/cake-promo", {
    apiVersion: 3,
    title: "Tiny Cake Promo",
    icon: "food",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Cake promo", initialOpen: true },
            text("Eyebrow", "eyebrow", props),
            area("Headline", "headline", props),
            area("Copy", "copy", props),
            text("Card title", "cardTitle", props),
            text("Card meta", "cardMeta", props),
            text("Build button", "buildLabel", props),
            text("Build URL", "buildUrl", props),
            text("Browse button", "browseLabel", props),
            text("Browse URL", "browseUrl", props),
            text("Thumb URL", "thumb", props),
            mediaButton("Replace thumb", "thumb", props)
          )
        ),
        preview("tiny/cake-promo", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/faq", {
    apiVersion: 3,
    title: "Tiny FAQ",
    icon: "editor-help",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      var items = props.attributes.items || [];
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "FAQ", initialOpen: true },
            text("Eyebrow", "eyebrow", props),
            text("Headline", "headline", props),
            area("Intro", "intro", props),
            items.map(function (item, index) {
              return el("div", { key: index, className: "tiny-repeat__row" },
                el(TextControl, {
                  label: "Question " + (index + 1),
                  value: item.question || "",
                  onChange: function (value) {
                    var next = items.slice();
                    next[index] = Object.assign({}, item, { question: value });
                    props.setAttributes({ items: next });
                  },
                }),
                el(TextareaControl, {
                  label: "Answer",
                  value: item.answer || "",
                  onChange: function (value) {
                    var next = items.slice();
                    next[index] = Object.assign({}, item, { answer: value });
                    props.setAttributes({ items: next });
                  },
                })
              );
            })
          )
        ),
        preview("tiny/faq", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/closing", {
    apiVersion: 3,
    title: "Tiny Closing",
    icon: "megaphone",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Closing", initialOpen: true },
            text("Headline", "headline", props),
            area("Copy", "copy", props),
            text("Primary button", "primaryLabel", props),
            text("Primary URL", "primaryUrl", props),
            text("Secondary link", "secondaryLabel", props),
            text("Secondary URL", "secondaryUrl", props),
            listArea("Points", "points", props)
          )
        ),
        preview("tiny/closing", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/sticky-bar", {
    apiVersion: 3,
    title: "Tiny Sticky Bar",
    icon: "button",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Sticky buttons", initialOpen: true },
            text("Variant (landing or cakes)", "variant", props),
            text("Primary label", "primaryLabel", props),
            text("Primary URL", "primaryUrl", props),
            text("Secondary label", "secondaryLabel", props),
            text("Secondary URL", "secondaryUrl", props)
          )
        ),
        appNote("Mobile sticky bar", "Shows on phones after the hero. Edit labels and links in the sidebar.")
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/landing-revised", {
    apiVersion: 3,
    title: "Tiny About Birthdays Revised",
    icon: "star-filled",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function () {
      return appNote(
        "About Birthdays Revised",
        "This block renders the revised birthday landing (new hero, steps, slider, tasting section, folded FAQ, reviews at the end). Leave it as the only block on the About Birthdays Revised page."
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/party-builder", {
    apiVersion: 3,
    title: "Tiny Party Builder",
    icon: "hammer",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function () {
      return appNote(
        "Party builder app",
        "This block is the live birthday wizard (packages, decor, cake, quote, WhatsApp). Do not replace it with columns or HTML — layout and quotes stay in the existing JavaScript and party.json. Edit marketing copy on the Birthdays page instead."
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/cakes-hero", {
    apiVersion: 3,
    title: "Tiny Cakes Hero",
    icon: "camera",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Cake hero", initialOpen: true },
            text("Eyebrow", "eyebrow", props),
            area("Headline", "headline", props),
            area("Subheading", "sub", props),
            text("Primary button", "primaryLabel", props),
            text("Primary URL", "primaryUrl", props),
            text("Secondary link", "secondaryLabel", props),
            text("Secondary URL", "secondaryUrl", props),
            text("Main image URL", "image", props),
            mediaButton("Replace main image", "image", props),
            text("Inset image URL", "inset", props),
            mediaButton("Replace inset", "inset", props)
          )
        ),
        preview("tiny/cakes-hero", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/cakes-facts", {
    apiVersion: 3,
    title: "Tiny Cakes Facts",
    icon: "info",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      var items = props.attributes.items || [];
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Facts", initialOpen: true },
            items.map(function (item, index) {
              return el("div", { key: index, className: "tiny-repeat__row" },
                el(TextControl, {
                  label: "Title " + (index + 1),
                  value: item.title || "",
                  onChange: function (value) {
                    var next = items.slice();
                    next[index] = Object.assign({}, item, { title: value });
                    props.setAttributes({ items: next });
                  },
                }),
                el(TextControl, {
                  label: "Text",
                  value: item.text || "",
                  onChange: function (value) {
                    var next = items.slice();
                    next[index] = Object.assign({}, item, { text: value });
                    props.setAttributes({ items: next });
                  },
                })
              );
            })
          )
        ),
        preview("tiny/cakes-facts", props)
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/cake-app", {
    apiVersion: 3,
    title: "Tiny Cake Builder",
    icon: "carrot",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function (props) {
      return el(Fragment, null,
        el(InspectorControls, null,
          el(PanelBody, { title: "Intro copy", initialOpen: true },
            text("Gallery headline", "galleryHeadline", props),
            text("Eyebrow", "eyebrow", props),
            text("Headline", "headline", props),
            area("Copy", "copy", props)
          )
        ),
        appNote(
          "Cake gallery & order form",
          "The live cake catalogue, diet filters and WhatsApp form stay in the existing JavaScript and cakes.json. Intro copy can be edited in the sidebar. Do not replace this block."
        )
      );
    },
    save: function () { return null; },
  });
})(window.wp);
