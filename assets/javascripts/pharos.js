(function () {
  "use strict";

  const doc = document;
  const body = doc.body;

  const qs = (selector, root = doc) => root.querySelector(selector);
  const qsa = (selector, root = doc) => Array.from(root.querySelectorAll(selector));

  let chinaAccessPromise = null;
  let commentsLoadPromise = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectResponsiveEmbedStyles() {
    if (doc.getElementById("fit-vids-style")) {
      return;
    }

    const style = doc.createElement("style");
    style.id = "fit-vids-style";
    style.textContent =
      ".fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed{position:absolute;top:0;left:0;width:100%;height:100%;}";
    doc.head.appendChild(style);
  }

  function initResponsiveEmbeds() {
    const selectors = [
      'article iframe[src*="player.vimeo.com"]',
      'article iframe[src*="player.youku.com"]',
      'article iframe[src*="youku.com"]',
      'article iframe[src*="youtube.com"]',
      'article iframe[src*="youtube-nocookie.com"]',
      'article iframe[src*="kickstarter.com"][src*="video.html"]',
      "article object",
      "article embed",
    ];
    const embeds = qsa(selectors.join(","));

    if (!embeds.length) {
      return;
    }

    injectResponsiveEmbedStyles();

    embeds.forEach((embed) => {
      if (
        embed.closest(".fitvidsignore") ||
        embed.parentElement?.classList.contains("fluid-width-video-wrapper") ||
        (embed.tagName.toLowerCase() === "embed" &&
          embed.parentElement?.tagName.toLowerCase() === "object")
      ) {
        return;
      }

      const width = parseInt(embed.getAttribute("width"), 10) || embed.clientWidth || 16;
      const height = parseInt(embed.getAttribute("height"), 10) || embed.clientHeight || 9;
      const ratio = Math.min(Math.max(height / width, 0.2), 3);

      const wrapper = doc.createElement("div");
      wrapper.className = "fluid-width-video-wrapper";
      wrapper.style.paddingTop = `${ratio * 100}%`;

      embed.parentNode.insertBefore(wrapper, embed);
      wrapper.appendChild(embed);
      embed.removeAttribute("height");
      embed.removeAttribute("width");
    });
  }

  function initNavigation() {
    const navigationToggle = qs(".toggle-navigation");

    if (navigationToggle) {
      navigationToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        body.classList.toggle("open-navigation");
      });
    }

    qsa(".cover, .content").forEach((element) => {
      element.addEventListener("click", () => {
        body.classList.remove("open-navigation");
      });
    });
  }

  function setCommentsStatus(section, message, isError) {
    const status = qs(".comments-status", section);

    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function checkIfInChina() {
    if (chinaAccessPromise) {
      return chinaAccessPromise;
    }

    chinaAccessPromise = new Promise((resolve) => {
      const request = new XMLHttpRequest();
      let settled = false;

      const finish = (value) => {
        if (settled) {
          return;
        }

        settled = true;
        resolve(value);
      };

      request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
          finish(false);
        }
      };

      request.onerror = function () {
        finish(true);
      };

      try {
        request.open("GET", "https://graph.facebook.com/feed?callback=h", true);
        request.send();
      } catch (error) {
        finish(true);
        return;
      }

      window.setTimeout(() => {
        try {
          request.abort();
        } catch (error) {
          // Ignore abort errors.
        }
        finish(true);
      }, 1000);
    });

    return chinaAccessPromise;
  }

  function loadComments(section) {
    if (!section) {
      return Promise.resolve(false);
    }

    if (section.dataset.commentsReady === "true") {
      return Promise.resolve(true);
    }

    if (commentsLoadPromise) {
      return commentsLoadPromise;
    }

    const loadButton = qs(".comments-load", section);
    const shortname = section.dataset.disqusShortname;
    const identifier = section.dataset.disqusIdentifier || window.location.pathname;

    if (!shortname) {
      return Promise.resolve(false);
    }

    if (loadButton) {
      loadButton.disabled = true;
    }

    setCommentsStatus(section, "Loading comments...", false);

    commentsLoadPromise = checkIfInChina()
      .then((inChina) => {
        if (inChina) {
          setCommentsStatus(section, "Comments require a VPN in mainland China.", true);
          window.alert("请使用科学上网法进行评论 ^_^!");
          return false;
        }

        return new Promise((resolve, reject) => {
          if (window.DISQUS) {
            section.dataset.commentsReady = "true";
            section.classList.add("is-ready");
            setCommentsStatus(section, "", false);
            resolve(true);
            return;
          }

          window.disqus_config = function () {
            this.page.identifier = identifier;
            this.page.url = window.location.href;
            this.page.title = doc.title;
          };

          const disqusScript = doc.createElement("script");
          disqusScript.async = true;
          disqusScript.src = `https://${shortname}.disqus.com/embed.js`;
          disqusScript.setAttribute("data-timestamp", String(Date.now()));
          disqusScript.onload = function () {
            section.dataset.commentsReady = "true";
            section.classList.add("is-ready");
            setCommentsStatus(section, "", false);
            resolve(true);
          };
          disqusScript.onerror = function () {
            setCommentsStatus(section, "Comments failed to load. Try again.", true);
            reject(new Error("Failed to load Disqus"));
          };

          (doc.head || doc.body).appendChild(disqusScript);
        });
      })
      .catch(() => {
        setCommentsStatus(section, "Comments failed to load. Try again.", true);
        return false;
      })
      .finally(() => {
        if (loadButton) {
          loadButton.disabled = false;
        }

        if (section.dataset.commentsReady !== "true") {
          commentsLoadPromise = null;
        }
      });

    return commentsLoadPromise;
  }

  function initComments() {
    const commentsSection = qs(".comments");
    const commentsToggles = qsa(".toggle-comments");
    const commentsLoadButton = qs(".comments-load", commentsSection);

    if (!commentsSection) {
      return;
    }

    const syncExpandedState = () => {
      commentsToggles.forEach((toggle) => {
        toggle.setAttribute(
          "aria-expanded",
          body.classList.contains("open-comments") ? "true" : "false"
        );
      });
    };

    if (commentsLoadButton) {
      commentsLoadButton.addEventListener("click", () => {
        loadComments(commentsSection);
      });
    }

    commentsToggles.forEach((toggle) => {
      toggle.addEventListener("click", async (event) => {
        event.preventDefault();

        const willOpen = !body.classList.contains("open-comments");
        body.classList.toggle("open-comments", willOpen);
        syncExpandedState();

        if (!willOpen) {
          return;
        }

        const loaded = await loadComments(commentsSection);

        if (!loaded) {
          body.classList.remove("open-comments");
          syncExpandedState();
        }
      });
    });

    syncExpandedState();
  }

  function initPhotoExperience() {
    const mainPhoto = qs("#main-photo");
    const photoContainer = qs(".photo-card-container");
    const photoCard = qs(".photo-card-bg");
    const cover = qs(".cover");
    const content = qs(".content");
    const coverHeadline = qs(".cover-headline");
    const backgroundBlur = qs("#bg-blur");
    const info = qs("#photoInfo");
    const coverActionCluster = qs(".cover-action-cluster");
    const readingModeButton = qs("#reading-mode-btn");
    const readingModeControl = qs(".reading-mode-control");
    const photoEntryButton = qs("#photo-entry-btn");
    const photoEntryControl = qs(".photo-entry-control");
    const photoEntryLabel = qs("#photo-entry-label");
    const photoEntryTooltip = qs("#photo-entry-tooltip");
    const photoStageControls = qs(".photo-stage__controls");
    const photoNextButton = qs("#photo-next-btn");
    const photoCounter = qs("#photo-counter");
    const hasPhotoExperience = Boolean(
      mainPhoto &&
      photoContainer &&
      photoCard &&
      photoEntryButton &&
      photoEntryControl &&
      photoStageControls
    );

    if (coverHeadline && coverHeadline.textContent.trim() === "Douban") {
      coverHeadline.classList.add("douban-title");
    }

    if (!cover || !content || !readingModeButton) {
      return;
    }

    const galleryImages = hasPhotoExperience
      ? qsa(".article-content figure.kg-image-card img, .article-content img").filter(
          (image, index, list) =>
            image.getAttribute("src") &&
            !image.closest("a") &&
            list.indexOf(image) === index
        )
      : [];

    const fallbackToggleTheme = createToggleTheme({r: 46, g: 57, b: 72}, "cover");
    const photoItems = [];
    const photoLookup = new Map();
    const photoExifCache = new Map();
    const featureImageInfo = info?.dataset.alt?.trim() || "";
    const featureImageCaption = info?.dataset.caption?.trim() || "";

    let resizeFrame = null;
    let layoutMode = "both";
    let coverToggleTheme = fallbackToggleTheme;
    let photoToggleTheme = fallbackToggleTheme;
    let currentPhotoIndex = 0;
    let photoInfoRequestId = 0;

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function mixColors(source, target, weight) {
      return {
        r: Math.round(source.r * (1 - weight) + target.r * weight),
        g: Math.round(source.g * (1 - weight) + target.g * weight),
        b: Math.round(source.b * (1 - weight) + target.b * weight),
      };
    }

    function toRgb(color) {
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    function toRgba(color, alpha) {
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    }

    function getRelativeLuminance(color) {
      const channels = [color.r, color.g, color.b].map((channel) => {
        const value = channel / 255;

        return value <= 0.03928
          ? value / 12.92
          : Math.pow((value + 0.055) / 1.055, 2.4);
      });

      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }

    function createToggleTheme(baseColor, surface) {
      const isLightSurface = getRelativeLuminance(baseColor) > 0.42;
      const shellWeight = surface === "camera" ? 0.78 : 0.84;
      const shell = isLightSurface
        ? mixColors(baseColor, {r: 10, g: 14, b: 18}, shellWeight)
        : mixColors(baseColor, {r: 255, g: 255, b: 255}, 0.18);
      const hover = isLightSurface
        ? mixColors(shell, {r: 255, g: 255, b: 255}, 0.08)
        : mixColors(shell, {r: 255, g: 255, b: 255}, 0.14);
      const active = isLightSurface
        ? mixColors(baseColor, {r: 8, g: 12, b: 16}, 0.7)
        : mixColors(baseColor, {r: 255, g: 255, b: 255}, 0.3);
      const panel = isLightSurface
        ? mixColors(baseColor, {r: 8, g: 10, b: 14}, 0.9)
        : mixColors(baseColor, {r: 255, g: 255, b: 255}, 0.08);
      const ink = isLightSurface
        ? {r: 19, g: 24, b: 31}
        : {r: 245, g: 247, b: 250};

      return {
        "--zen-toggle-ink": toRgb(ink),
        "--zen-toggle-surface": toRgba(shell, isLightSurface ? 0.76 : 0.22),
        "--zen-toggle-surface-hover": toRgba(hover, isLightSurface ? 0.84 : 0.28),
        "--zen-toggle-surface-active": toRgba(active, isLightSurface ? 0.88 : 0.34),
        "--zen-toggle-border": toRgba(
          isLightSurface
            ? mixColors(shell, {r: 255, g: 255, b: 255}, 0.12)
            : mixColors(baseColor, {r: 255, g: 255, b: 255}, 0.68),
          isLightSurface ? 0.54 : 0.42
        ),
        "--zen-toggle-border-active": toRgba(
          isLightSurface
            ? mixColors(active, {r: 255, g: 255, b: 255}, 0.22)
            : mixColors(baseColor, {r: 255, g: 255, b: 255}, 0.82),
          isLightSurface ? 0.66 : 0.58
        ),
        "--zen-toggle-panel": toRgba(panel, isLightSurface ? 0.26 : 0.16),
        "--zen-toggle-panel-border": toRgba(
          isLightSurface
            ? mixColors(baseColor, {r: 255, g: 255, b: 255}, 0.18)
            : mixColors(baseColor, {r: 255, g: 255, b: 255}, 0.55),
          isLightSurface ? 0.22 : 0.24
        ),
        "--zen-toggle-shadow": toRgba(
          isLightSurface ? {r: 4, g: 8, b: 14} : {r: 0, g: 0, b: 0},
          isLightSurface ? 0.32 : 0.24
        ),
        "--zen-toggle-highlight": toRgba(
          isLightSurface
            ? {r: 255, g: 255, b: 255}
            : mixColors(baseColor, {r: 255, g: 255, b: 255}, 0.72),
          isLightSurface ? 0.1 : 0.22
        ),
      };
    }

    function applyToggleTheme(theme) {
      if (!theme) {
        return;
      }

      [coverActionCluster, photoStageControls, info, photoNextButton, photoCounter].forEach(
        (element) => {
          if (!element) {
            return;
          }

          Object.entries(theme).forEach(([name, value]) => {
            element.style.setProperty(name, value);
          });
        }
      );
    }

    function syncToggleTheme() {
      applyToggleTheme(layoutMode === "camera" ? photoToggleTheme : coverToggleTheme);
    }

    function updateThemesFromColor(color) {
      if (!color) {
        return;
      }

      photoToggleTheme = createToggleTheme(color, "camera");
      coverToggleTheme = createToggleTheme(
        mixColors(color, {r: 255, g: 255, b: 255}, 0.04),
        "cover"
      );
      syncToggleTheme();
    }

    function setElementDisplay(element, visible, displayValue) {
      if (!element) {
        return;
      }

      element.style.display = visible ? displayValue : "none";
    }

    function splitInfoTokens(value) {
      const text = String(value || "").trim();

      if (!text) {
        return [];
      }

      let tokens = text
        .split(/\s*[|\n]\s*/g)
        .map((part) => part.trim())
        .filter(Boolean);

      if (
        tokens.length <= 1 &&
        /,\s*(?:f\/|\d+mm|iso\s*\d+|\d+\/\d+|1\/\d+)/i.test(text)
      ) {
        tokens = text
          .split(/\s*,\s*/g)
          .map((part) => part.trim())
          .filter(Boolean);
      }

      return tokens;
    }

    function formatNumericValue(value, maximumFractionDigits) {
      if (!Number.isFinite(value)) {
        return "";
      }

      return new Intl.NumberFormat("zh-CN", {
        maximumFractionDigits,
      }).format(value);
    }

    function formatExposureTime(value) {
      if (!Number.isFinite(value) || value <= 0) {
        return "";
      }

      if (value >= 1) {
        return `${formatNumericValue(value, value >= 10 ? 0 : 1)}s`;
      }

      const denominator = Math.round(1 / value);

      if (denominator > 1 && Math.abs(1 / denominator - value) <= 0.02) {
        return `1/${denominator}s`;
      }

      return `${formatNumericValue(value, 3)}s`;
    }

    function formatFNumber(value) {
      if (!Number.isFinite(value) || value <= 0) {
        return "";
      }

      return `f/${formatNumericValue(value, 1)}`;
    }

    function formatFocalLength(value) {
      if (!Number.isFinite(value) || value <= 0) {
        return "";
      }

      return `${formatNumericValue(value, value >= 10 ? 0 : 1)}mm`;
    }

    function normalizeBranding(value) {
      return String(value || "")
        .replace(/\bCORPORATION\b/gi, "")
        .replace(/\bCO\.,?\s*LTD\.?\b/gi, "")
        .replace(/^NIKON\b/gi, "Nikon")
        .replace(/^CANON\b/gi, "Canon")
        .replace(/^SONY\b/gi, "Sony")
        .replace(/^PENTAX\b/gi, "Pentax")
        .replace(/^FUJIFILM\b/gi, "FUJIFILM")
        .replace(/\s+/g, " ")
        .trim();
    }

    function buildCameraLabel(exif) {
      const make = normalizeBranding(exif?.make || "");
      const model = normalizeBranding(exif?.model || "");

      if (model && make && model.toLowerCase().indexOf(make.toLowerCase()) === -1) {
        return `${make} ${model}`.trim();
      }

      return model || make;
    }

    function buildExifMeta(exif) {
      if (!exif) {
        return [];
      }

      const meta = [];
      const lensModel = normalizeBranding(exif.lensModel || "");
      const focalLength = formatFocalLength(exif.focalLength);
      const fNumber = formatFNumber(exif.fNumber);
      const exposureTime = formatExposureTime(exif.exposureTime);
      const iso = Number.isFinite(exif.iso) && exif.iso > 0 ? `ISO ${Math.round(exif.iso)}` : "";

      if (lensModel) {
        meta.push(lensModel);
      }

      [focalLength, fNumber, exposureTime, iso].forEach((part) => {
        if (part) {
          meta.push(part);
        }
      });

      return meta;
    }

    function buildOriginalCandidates(source) {
      if (!source) {
        return [];
      }

      try {
        const sourceUrl = new URL(source, window.location.href);
        const normalizedPath = sourceUrl.pathname.replace(
          /\/content\/images\/size\/w\d+\//,
          "/content/images/"
        );
        const originalPath = normalizedPath.replace(/(_o)?(\.[a-z0-9]+)$/i, "_o$2");

        return Array.from(
          new Set([
            `${sourceUrl.origin}${originalPath}`,
            `${sourceUrl.origin}${normalizedPath}`,
          ])
        );
      } catch (error) {
        return [source];
      }
    }

    function getAsciiString(view, offset, length) {
      let result = "";

      for (let index = 0; index < length && offset + index < view.byteLength; index += 1) {
        const code = view.getUint8(offset + index);

        if (!code) {
          break;
        }

        result += String.fromCharCode(code);
      }

      return result;
    }

    function parseJpegExif(buffer) {
      const view = new DataView(buffer);
      let offset = 2;

      const parseTiff = (tiffOffset) => {
        const byteOrder = getAsciiString(view, tiffOffset, 2);
        const littleEndian = byteOrder === "II";
        const getUint16At = (targetOffset) => view.getUint16(targetOffset, littleEndian);
        const getUint32At = (targetOffset) => view.getUint32(targetOffset, littleEndian);
        const getInt32At = (targetOffset) => view.getInt32(targetOffset, littleEndian);
        const tags = {};
        const tagMap = {
          0x010f: "make",
          0x0110: "model",
          0x0132: "modifyDate",
          0x829a: "exposureTime",
          0x829d: "fNumber",
          0x8769: "exifIFDPointer",
          0x8827: "iso",
          0x9003: "dateTimeOriginal",
          0x920a: "focalLength",
          0xa405: "focalLengthIn35mmFilm",
          0xa434: "lensModel",
        };
        const bytesByType = {
          1: 1,
          2: 1,
          3: 2,
          4: 4,
          5: 8,
          7: 1,
          9: 4,
          10: 8,
        };

        const readValue = (type, count, valueOffset) => {
          const unitSize = bytesByType[type];

          if (!unitSize) {
            return null;
          }

          const totalBytes = unitSize * count;
          const dataOffset =
            totalBytes <= 4 ? valueOffset : tiffOffset + getUint32At(valueOffset);

          if (dataOffset < 0 || dataOffset + totalBytes > view.byteLength) {
            return null;
          }

          const readSingleValue = (position) => {
            switch (type) {
              case 1:
              case 7:
                return view.getUint8(position);
              case 2:
                return getAsciiString(view, position, count);
              case 3:
                return view.getUint16(position, littleEndian);
              case 4:
                return view.getUint32(position, littleEndian);
              case 5: {
                const numerator = getUint32At(position);
                const denominator = getUint32At(position + 4);
                return denominator ? numerator / denominator : 0;
              }
              case 9:
                return getInt32At(position);
              case 10: {
                const numerator = getInt32At(position);
                const denominator = getInt32At(position + 4);
                return denominator ? numerator / denominator : 0;
              }
              default:
                return null;
            }
          };

          if (type === 2) {
            return getAsciiString(view, dataOffset, count);
          }

          if (count === 1) {
            return readSingleValue(dataOffset);
          }

          return Array.from({length: count}, (_, index) => readSingleValue(dataOffset + index * unitSize));
        };

        const readIFD = (relativeOffset) => {
          if (!relativeOffset || tiffOffset + relativeOffset + 2 > view.byteLength) {
            return;
          }

          const entryCount = getUint16At(tiffOffset + relativeOffset);
          let entryOffset = tiffOffset + relativeOffset + 2;

          for (let index = 0; index < entryCount; index += 1) {
            const tag = getUint16At(entryOffset);
            const type = getUint16At(entryOffset + 2);
            const count = getUint32At(entryOffset + 4);
            const key = tagMap[tag];
            const value = readValue(type, count, entryOffset + 8);

            if (key) {
              tags[key] = value;
            }

            entryOffset += 12;
          }
        };

        readIFD(getUint32At(tiffOffset + 4));

        if (tags.exifIFDPointer) {
          readIFD(tags.exifIFDPointer);
        }

        return tags;
      };

      while (offset + 4 <= view.byteLength) {
        if (view.getUint8(offset) !== 0xff) {
          offset += 1;
          continue;
        }

        while (offset < view.byteLength && view.getUint8(offset) === 0xff) {
          offset += 1;
        }

        if (offset >= view.byteLength) {
          break;
        }

        const marker = view.getUint8(offset);
        offset += 1;

        if (marker === 0xd9 || marker === 0xda) {
          break;
        }

        if (offset + 2 > view.byteLength) {
          break;
        }

        const length = view.getUint16(offset, false);
        offset += 2;

        if (
          marker === 0xe1 &&
          length >= 8 &&
          getAsciiString(view, offset, 6) === "Exif"
        ) {
          return parseTiff(offset + 6);
        }

        offset += length - 2;
      }

      return null;
    }

    async function loadPhotoExif(source) {
      const candidates = buildOriginalCandidates(source).filter((candidate) =>
        /\.(jpe?g)(?:$|[?#])/i.test(candidate)
      );

      for (const candidate of candidates) {
        try {
          const response = await window.fetch(candidate, {
            credentials: "same-origin",
            cache: "force-cache",
          });

          if (!response.ok) {
            continue;
          }

          const buffer = await response.arrayBuffer();
          const exif = parseJpegExif(buffer);

          if (exif && (exif.model || exif.lensModel || exif.exposureTime || exif.iso)) {
            return exif;
          }
        } catch (error) {
          // Ignore EXIF read failures and fall through to the next candidate.
        }
      }

      return null;
    }

    async function getPhotoExif(source) {
      const cacheKey = buildOriginalCandidates(source).join("|");

      if (!cacheKey) {
        return null;
      }

      if (!photoExifCache.has(cacheKey)) {
        photoExifCache.set(cacheKey, loadPhotoExif(source));
      }

      return photoExifCache.get(cacheKey);
    }

    function mergeInfoMeta(primary, secondary) {
      const values = [];
      const seen = new Set();

      [primary, secondary].forEach((list) => {
        list.forEach((item) => {
          const value = String(item || "").trim();
          const normalized = value.toLowerCase();

          if (!value || seen.has(normalized)) {
            return;
          }

          seen.add(normalized);
          values.push(value);
        });
      });

      return values;
    }

    function renderPhotoInfoContent(payload) {
      if (!info) {
        return;
      }

      const title = payload?.title?.trim() || "";
      const caption = payload?.caption?.trim() || "";
      const meta = Array.isArray(payload?.meta) ? payload.meta.filter(Boolean) : [];

      if (!title && !caption && !meta.length) {
        info.textContent = "";
        return;
      }

      const titleHtml = title ? `<strong>${escapeHtml(title)}</strong>` : "";
      const metaHtml = meta.length
        ? `<div class="photo-info__meta">${meta
            .map((part) => `<span class="photo-info__pill">${escapeHtml(part)}</span>`)
            .join("")}</div>`
        : "";
      const captionHtml = caption
        ? `<div class="photo-info__caption">${escapeHtml(caption).replace(/\n/g, "<br>")}</div>`
        : "";

      info.innerHTML = `${titleHtml}${metaHtml}${captionHtml}`;
    }

    async function refreshPhotoInfo(item) {
      if (!info) {
        return;
      }

      const requestId = ++photoInfoRequestId;
      const manualTokens = splitInfoTokens(item?.info);
      const manualTitle = manualTokens[0] || "";
      const manualMeta = manualTokens.slice(1);
      let title = manualTitle;
      let meta = manualMeta;
      const caption = item?.caption?.trim() || "";

      renderPhotoInfoContent({
        title,
        meta,
        caption,
      });

      if (!item?.src) {
        return;
      }

      const exif = await getPhotoExif(item.src);

      if (requestId !== photoInfoRequestId || !exif) {
        return;
      }

      if (!title) {
        title = buildCameraLabel(exif);
      }

      meta = mergeInfoMeta(meta, buildExifMeta(exif));

      renderPhotoInfoContent({
        title,
        meta,
        caption,
      });
    }

    function resizePhoto() {
      resizeFrame = null;
      mainPhoto.style.width = "";
      mainPhoto.style.height = "";
    }

    function scheduleResize() {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(resizePhoto);
    }

    function getAverageColor(image) {
      const canvas = doc.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context || !image.naturalWidth || !image.naturalHeight) {
        return null;
      }

      canvas.width = Math.max(Math.min(image.naturalWidth, 320), 1);
      canvas.height = Math.max(
        Math.round((canvas.width / image.naturalWidth) * image.naturalHeight),
        1
      );
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;

      for (let index = 0; index < imageData.length; index += 320) {
        red += imageData[index];
        green += imageData[index + 1];
        blue += imageData[index + 2];
        count += 1;
      }

      if (!count) {
        return null;
      }

      return {
        r: clamp(Math.round(red / count), 0, 255),
        g: clamp(Math.round(green / count), 0, 255),
        b: clamp(Math.round(blue / count), 0, 255),
      };
    }

    function updatePhotoBackground(color) {
      if (!color) {
        return;
      }

      photoContainer.style.background = `radial-gradient(ellipse at 55% 45%, ${toRgb(
        color
      )} 53%, #232323 100%)`;
    }

    function refreshPhotoVisuals() {
      if (!mainPhoto.getAttribute("src")) {
        return;
      }

      scheduleResize();

      const color = getAverageColor(mainPhoto);

      if (!color) {
        return;
      }

      updatePhotoBackground(color);
      updateThemesFromColor(color);
    }

    function escapeCssUrl(value) {
      return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }

    function setCoverBackground(source) {
      if (!source) {
        return;
      }

      cover.style.background = `linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15)), url("${escapeCssUrl(
        source
      )}")`;
    }

    function normalizeUrl(source) {
      try {
        return new URL(source, window.location.href).href;
      } catch (error) {
        return source;
      }
    }

    function buildPhotoItem(options) {
      if (!options?.src) {
        return null;
      }

      return {
        src: options.src,
        blurSrc: options.blurSrc || options.src,
        srcset: options.srcset || "",
        sizes: options.sizes || "",
        alt: options.alt || coverHeadline?.textContent.trim() || doc.title || "",
        info: options.info || "",
        caption: options.caption || "",
      };
    }

    function registerPhotoItem(item) {
      if (!item?.src) {
        return null;
      }

      const key = normalizeUrl(item.src);

      if (photoLookup.has(key)) {
        return photoLookup.get(key);
      }

      photoLookup.set(key, item);
      photoItems.push(item);
      return item;
    }

    function hasInlinePhotoInfo(item) {
      return splitInfoTokens(item?.info).length > 0;
    }

    async function isPhotoEligible(item) {
      if (!item?.src) {
        return false;
      }

      if (hasInlinePhotoInfo(item)) {
        return true;
      }

      return Boolean(await getPhotoExif(item.src));
    }

    function syncCoverActionClusterVisibility() {
      if (!coverActionCluster) {
        return;
      }

      const hasVisibleAction = [readingModeControl, photoEntryControl]
        .filter(Boolean)
        .some((element) => {
          const styles = window.getComputedStyle(element);

          return (
            !element.classList.contains("is-hidden") &&
            !element.hidden &&
            styles.display !== "none" &&
            styles.visibility !== "hidden"
          );
        });

      coverActionCluster.classList.toggle("is-hidden", !hasVisibleAction);
    }

    function syncPhotoControls() {
      const multiplePhotos = photoItems.length > 1;

      if (photoStageControls) {
        photoStageControls.hidden = !multiplePhotos;
      }

      if (photoNextButton) {
        photoNextButton.hidden = !multiplePhotos;
      }

      if (photoCounter) {
        photoCounter.hidden = !multiplePhotos;
        photoCounter.textContent = multiplePhotos
          ? `${currentPhotoIndex + 1} / ${photoItems.length}`
          : "";
      }
    }

    function syncLayoutState(mode) {
      body.classList.toggle("post-layout-split", mode === "both");
      body.classList.toggle("post-layout-reading", mode === "text");
      body.classList.toggle("post-layout-camera", hasPhotoExperience && mode === "camera");
    }

    function setPhotoEntryState(isCameraMode) {
      if (!photoEntryButton) {
        return;
      }

      photoEntryButton.classList.toggle("is-active", isCameraMode);
      photoEntryButton.setAttribute("aria-pressed", String(isCameraMode));
      photoEntryButton.setAttribute("aria-label", isCameraMode ? "返回文章" : "查看摄影作品");

      if (photoEntryLabel) {
        photoEntryLabel.textContent = isCameraMode ? "返回" : "作品";
      }

      if (photoEntryTooltip) {
        photoEntryTooltip.textContent = isCameraMode ? "返回文章" : "进入摄影视图";
      }
    }

    function setReadingModeState(isTextMode) {
      readingModeButton.classList.toggle("is-active", isTextMode);
      readingModeButton.setAttribute("aria-pressed", String(isTextMode));
    }

    function imageToPhotoItem(image) {
      if (!image) {
        return null;
      }

      const src = image.currentSrc || image.getAttribute("src");

      if (!src) {
        return null;
      }

      const figure = image.closest("figure");
      const caption = qs("figcaption", figure)?.textContent.trim() || "";

      return buildPhotoItem({
        src,
        blurSrc: image.getAttribute("src") || src,
        srcset: image.getAttribute("srcset") || "",
        sizes: image.getAttribute("srcset") ? "80vw" : "",
        alt: image.getAttribute("alt") || coverHeadline?.textContent.trim() || doc.title || "",
        info: image.getAttribute("alt") || image.getAttribute("title") || "",
        caption,
      });
    }

    function applyPhotoSource(item) {
      if (!hasPhotoExperience || !item?.src) {
        return false;
      }

      mainPhoto.setAttribute("src", item.src);

      if (item.srcset) {
        mainPhoto.setAttribute("srcset", item.srcset);
      } else {
        mainPhoto.removeAttribute("srcset");
      }

      if (item.sizes) {
        mainPhoto.setAttribute("sizes", item.sizes);
      } else {
        mainPhoto.removeAttribute("sizes");
      }

      mainPhoto.setAttribute("alt", item.alt);

      if (backgroundBlur) {
        backgroundBlur.setAttribute("src", item.blurSrc || item.src);
      }

      setCoverBackground(item.src);
      refreshPhotoInfo(item);
      syncPhotoControls();
      return true;
    }

    function applyPhotoByIndex(index) {
      if (!photoItems.length) {
        return false;
      }

      currentPhotoIndex = (index + photoItems.length) % photoItems.length;
      return applyPhotoSource(photoItems[currentPhotoIndex]);
    }

    function hidePhotoExperience() {
      if (photoEntryControl) {
        photoEntryControl.classList.add("is-hidden");
      }

      if (!hasPhotoExperience) {
        syncCoverActionClusterVisibility();
        return;
      }

      if (photoCard) {
        photoCard.style.display = "none";
      }

      if (photoContainer) {
        photoContainer.style.display = "none";
        photoContainer.style.background = "";
      }

      syncCoverActionClusterVisibility();
    }

    function applyLayoutMode(mode) {
      layoutMode = mode;
      syncLayoutState(mode);
      setReadingModeState(mode === "text");
      setPhotoEntryState(hasPhotoExperience && mode === "camera");

      if (hasPhotoExperience && mode === "camera") {
        body.style.overflow = "hidden";
        setElementDisplay(content, false, "");
        cover.classList.remove("show-article");
        content.classList.remove("show-article-content");
        setElementDisplay(photoCard, true, "flex");
        setElementDisplay(photoContainer, true, "flex");

        if (readingModeControl) {
          readingModeControl.classList.add("is-hidden");
        }

        if (photoEntryControl) {
          photoEntryControl.classList.remove("is-hidden");
        }
        syncCoverActionClusterVisibility();

        syncToggleTheme();
        return;
      }

      body.style.overflow = "";
      setElementDisplay(content, true, "");

      if (hasPhotoExperience) {
        setElementDisplay(photoCard, false, "");
        setElementDisplay(photoContainer, false, "");
      }

      if (readingModeControl) {
        readingModeControl.classList.remove("is-hidden");
      }

      if (photoEntryControl) {
        photoEntryControl.classList.remove("is-hidden");
      }
      syncCoverActionClusterVisibility();

      syncToggleTheme();

      if (mode === "text") {
        cover.classList.add("show-article");
        content.classList.add("show-article-content");
        return;
      }

      cover.classList.remove("show-article");
      content.classList.remove("show-article-content");
    }

    if (readingModeButton) {
      readingModeButton.addEventListener("click", () => {
        applyLayoutMode(layoutMode === "text" ? "both" : "text");
      });
    }

    if (photoEntryButton) {
      photoEntryButton.addEventListener("click", () => {
        if (layoutMode === "camera") {
          applyLayoutMode("both");
          return;
        }

        applyLayoutMode("camera");
      });
    }

    if (photoNextButton) {
      photoNextButton.addEventListener("click", () => {
        if (!applyPhotoByIndex(currentPhotoIndex + 1)) {
          return;
        }

        if (mainPhoto.complete) {
          refreshPhotoVisuals();
        }
      });
    }

    if (hasPhotoExperience && mainPhoto) {
      mainPhoto.addEventListener("load", refreshPhotoVisuals);
    }

    window.addEventListener(
      "resize",
      () => {
        scheduleResize();
        syncCoverActionClusterVisibility();
      },
      {passive: true}
    );

    applyLayoutMode("both");

    if (!hasPhotoExperience) {
      return;
    }

    if (photoEntryControl) {
      photoEntryControl.classList.add("is-hidden");
    }
    syncCoverActionClusterVisibility();

    async function initializeQualifiedPhotos() {
      const photoCandidates = [];
      const featureCandidate = buildPhotoItem({
        src: mainPhoto.getAttribute("src") || "",
        blurSrc: backgroundBlur?.getAttribute("src") || "",
        srcset: mainPhoto.getAttribute("srcset") || "",
        sizes: mainPhoto.getAttribute("sizes") || "",
        alt: mainPhoto.getAttribute("alt") || coverHeadline?.textContent.trim() || doc.title || "",
        info: featureImageInfo,
        caption: featureImageCaption,
      });

      if (featureCandidate) {
        photoCandidates.push({item: featureCandidate, image: null});
      }

      galleryImages.forEach((image) => {
        const item = imageToPhotoItem(image);

        if (!item) {
          return;
        }

        photoCandidates.push({item, image});
      });

      const qualifiedCandidates = await Promise.all(
        photoCandidates.map(async (candidate) => ({
          candidate,
          eligible: await isPhotoEligible(candidate.item),
        }))
      );

      qualifiedCandidates.forEach(({candidate, eligible}) => {
        if (!eligible) {
          return;
        }

        const item = registerPhotoItem(candidate.item);

        if (!item || !candidate.image) {
          return;
        }

        candidate.image.addEventListener("click", (event) => {
          event.preventDefault();

          if (!applyPhotoByIndex(photoItems.indexOf(item))) {
            return;
          }

          applyLayoutMode("camera");
        });
      });

      if (!photoItems.length) {
        hidePhotoExperience();
        return;
      }

      if (photoEntryControl) {
        photoEntryControl.classList.remove("is-hidden");
      }
      syncCoverActionClusterVisibility();

      if (
        !mainPhoto.getAttribute("src") ||
        !photoLookup.has(normalizeUrl(mainPhoto.getAttribute("src")))
      ) {
        applyPhotoByIndex(0);
      } else {
        const currentIndex = photoItems.findIndex(
          (item) => normalizeUrl(item.src) === normalizeUrl(mainPhoto.getAttribute("src"))
        );

        currentPhotoIndex = currentIndex >= 0 ? currentIndex : 0;
        applyPhotoSource(photoItems[currentPhotoIndex]);
      }

      if (mainPhoto.complete && mainPhoto.getAttribute("src")) {
        refreshPhotoVisuals();
      }
    }

    initializeQualifiedPhotos();
  }

  function init() {
    initResponsiveEmbeds();
    initNavigation();
    initComments();
    initPhotoExperience();
  }

  init();
})();
