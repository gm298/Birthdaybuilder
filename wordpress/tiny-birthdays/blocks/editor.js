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

  registerBlockType("tiny/about-birthdays", {
    apiVersion: 3,
    title: "Tiny About Birthdays",
    icon: "star-filled",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function () {
      return appNote(
        "About Birthdays",
        "This block renders the About Birthdays page (hero, steps, offer slider, packages, tasting, FAQ, reviews). Leave it as the only block on the About Birthdays page."
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/reserve", {
    apiVersion: 3,
    title: "Tiny Table Reservations",
    icon: "calendar-alt",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function () {
      return appNote(
        "Table reservation wizard",
        "This block is the live reservation wizard (guests, date, time, table map). Requests go to Supabase and staff get them in /staff/. Do not replace this block."
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/booking", {
    apiVersion: 3,
    title: "Tiny Your Booking",
    icon: "id",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function () {
      return appNote(
        "Guest booking page",
        "Guests land here from the private link in their confirmation email to view, edit or cancel a reservation or birthday. Do not replace this block."
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/location", {
    apiVersion: 3,
    title: "Tiny Location",
    icon: "location",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function () {
      return appNote(
        "Location page",
        "Embedded Google Map of Tiny with directions, opening hours and contact links. Leave it as the only block on the Location page."
      );
    },
    save: function () { return null; },
  });

  registerBlockType("tiny/menu", {
    apiVersion: 3,
    title: "Tiny Menu Viewer",
    icon: "media-document",
    category: "tiny-birthdays",
    supports: { html: false, multiple: false, className: false },
    edit: function () {
      return appNote(
        "Menu viewer",
        "Shows the Food, Drink and Nights menu PDFs with download buttons. The PDFs ship with the plugin (assets/menu/pdf/tiny-food-menu.pdf, tiny-drink-menu.pdf, tiny-nights-menu.pdf); the viewer shows page images rendered from them (assets/menu/pages). To update a menu, replace the PDF in the site project, run scripts/render-menu-pages.py and the sync script, then re-upload the plugin."
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
