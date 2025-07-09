/*!
 * FitText.js 1.2
 *
 * Copyright 2011, Dave Rupert http://daverupert.com
 * Released under the WTFPL license
 * http://sam.zoy.org/wtfpl/
 *
 * Date: Thu May 05 14:23:00 2011 -0600
 */
!(function (t) {
  t.fn.fitText = function (n, i) {
    var e = n || 1,
      o = t.extend(
        {
          minFontSize: Number.NEGATIVE_INFINITY,
          maxFontSize: Number.POSITIVE_INFINITY,
        },
        i
      );
    return this.each(function () {
      var n = t(this),
        i = function () {
          n.css(
            "font-size",
            Math.max(
              Math.min(n.width() / (10 * e), parseFloat(o.maxFontSize)),
              parseFloat(o.minFontSize)
            )
          );
        };
      i(), t(window).on("resize.fittext orientationchange.fittext", i);
    });
  };
})(jQuery);

/*!
 * FitVids 1.1
 *
 * Copyright 2013, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
 * Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
 * Released under the WTFPL license - http://sam.zoy.org/wtfpl/
 *
 */
!(function (t) {
  "use strict";
  t.fn.fitVids = function (e) {
    var i = { customSelector: null, ignore: null };
    if (!document.getElementById("fit-vids-style")) {
      var r = document.head || document.getElementsByTagName("head")[0],
        a =
          ".fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}",
        d = document.createElement("div");
      (d.innerHTML = '<p>x</p><style id="fit-vids-style">' + a + "</style>"),
        r.appendChild(d.childNodes[1]);
    }
    return (
      e && t.extend(i, e),
      this.each(function () {
        var e = [
          'iframe[src*="player.vimeo.com"]',
          'iframe[src*="player.youku.com"]',
          'iframe[src*="youku.com"]',
          'iframe[src*="youtube.com"]',
          'iframe[src*="youtube-nocookie.com"]',
          'iframe[src*="kickstarter.com"][src*="video.html"]',
          "object",
          "embed",
        ];
        i.customSelector && e.push(i.customSelector);
        var r = ".fitvidsignore";
        i.ignore && (r = r + ", " + i.ignore);
        var a = t(this).find(e.join(","));
        (a = a.not("object object")),
          (a = a.not(r)),
          a.each(function (e) {
            var i = t(this);
            if (
              !(
                i.parents(r).length > 0 ||
                ("embed" === this.tagName.toLowerCase() &&
                  i.parent("object").length) ||
                i.parent(".fluid-width-video-wrapper").length
              )
            ) {
              i.css("height") ||
                i.css("width") ||
                (!isNaN(i.attr("height")) && !isNaN(i.attr("width"))) ||
                (i.attr("height", 9), i.attr("width", 16));
              var a =
                  "object" === this.tagName.toLowerCase() ||
                  (i.attr("height") && !isNaN(parseInt(i.attr("height"), 10)))
                    ? parseInt(i.attr("height"), 10)
                    : i.height(),
                d = isNaN(parseInt(i.attr("width"), 10))
                  ? i.width()
                  : parseInt(i.attr("width"), 10),
                o = a / d;
              if (!i.attr("id")) {
                var h = "fitvid" + e;
                i.attr("id", h);
              }
              i
                .wrap('<div class="fluid-width-video-wrapper"></div>')
                .parent(".fluid-width-video-wrapper")
                .css("padding-top", 100 * o + "%"),
                i.removeAttr("height").removeAttr("width");
            }
          });
      })
    );
  };
})(window.jQuery || window.Zepto);

newFunction();

function newFunction() {
  /*!
   * Pharos 1.0.2
   */
  (function ($) {
    "use strict";
    // $(".cover-headline").fitText(0.85);
    $("article").fitVids();
    $(document).ready(function () {
      $(".preload").addClass("fade");
    });
    $(".toggle-navigation").on("click", function () {
      $("body").toggleClass("open-navigation");
    });
    $(".toggle-comments").on("click", function (e) {
      isInChina(function (inChina) {
        if (inChina) {
          alert("请使用科学上网法进行评论 ^_^!");
          return false;
        }
        $("body").toggleClass("open-comments");
      });
    });
    $(".cover, .content").on("click", function () {
      $("body").removeClass("open-navigation");
    });

    // const btnPtoA = document.getElementById("ptaToggle");
    // const delay = 200; // 中间态停留时间(ms)

    // btnPtoA.addEventListener("click", () => {
    //   // 进入中间态
    //   btnPtoA.classList.remove("pta-state-photo", "pta-state-article");
    //   btnPtoA.classList.add("pta-state-mid");
    //   btnPtoA.setAttribute("aria-pressed", "mixed");

    //   setTimeout(() => {
    //     // 切换到目标态
    //     const wasPhoto = btnPtoA.getAttribute("data-state") !== "photo";
    //     btnPtoA.classList.remove("pta-state-mid");
    //     if (wasPhoto) {
    //       btnPtoA.classList.add("pta-state-photo");
    //       btnPtoA.setAttribute("data-state", "photo");
    //       btnPtoA.setAttribute("aria-pressed", "false");
    //       showArticle();
    //     } else {
    //       btnPtoA.classList.add("pta-state-article");
    //       btnPtoA.setAttribute("data-state", "article");
    //       btnPtoA.setAttribute("aria-pressed", "true");
    //       showPhotos();
    //     }
    //   }, delay);
    // });

    // // 初始 state
    // btnPtoA.setAttribute("data-state", "photo");
    // btnPtoA.classList.remove("pta-state-article");
    // btnPtoA.classList.add("pta-state-photo");
    // btnPtoA.setAttribute("aria-pressed", "true");

    if (!document.getElementById("main-photo")) {
    } else {
      const mainPhotoSrc = document
        .getElementById("main-photo")
        .getAttribute("src");
      const mainPhoto = document.getElementById("main-photo");
      const bgBlur = document.getElementById("bg-blur");
      mainPhoto.src = mainPhotoSrc;
      bgBlur.src = mainPhotoSrc;

      // 自适应照片尺寸（宽高不超80%视口，且保持原比例）
      function resizePhoto() {
        const img = mainPhoto;
        const vw = window.innerWidth;
        const vh = window.innerHeight - 80;
        // 等图片加载完再获取原始宽高
        if (img.naturalWidth && img.naturalHeight) {
          let maxW = vw * 0.8,
            maxH = vh * 0.8;
          let iw = img.naturalWidth,
            ih = img.naturalHeight;
          let scale = Math.min(maxW / iw, maxH / ih, 1);
          img.style.width = iw * scale + "px";
          img.style.height = ih * scale + "px";
        }
      }
      mainPhoto.onload = function () {
        resizePhoto();
        applyBgColor(mainPhoto);
      };
      window.addEventListener("resize", resizePhoto);
      // 主色调自动融合到背景
      function getAverageColor(img, callback) {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight - 100;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 80 * 4) {
          // 降低采样率
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        callback(`rgb(${r},${g},${b})`);
      }
      function applyBgColor(img) {
        getAverageColor(img, function (color) {
          $(".photo-card-container").css(
            "background",
            `radial-gradient(ellipse at 55% 45%, ${color} 53%, #232323 100%)`
          );
        });
      }

      // 首次加载
      if (mainPhoto.complete) {
        resizePhoto();
        applyBgColor(mainPhoto);
      }
      document.addEventListener("DOMContentLoaded", () => {
        const info = document.getElementById("photoInfo");
        const raw = info.dataset.alt; // 获取 data-alt，属性通过 dataset 访问
        if (!raw) return;

        const parts = raw.split(",").map((s) => s.trim());

        // 逗号前部分用 <strong>，其余用 <em>
        let html = parts
          .map((txt, idx) =>
            idx === 0 ? `<strong>${txt}</strong><br />` : `${txt}`
          )
          .join("");

        html = html.replace(/Z/gi, " ℤ ");
        // console.log(html);

        info.innerHTML = html;
      });
    }

    // function showPhotos() {
    //   $(".cover").removeClass("show-article");
    //   $(".content").removeClass("show-article-content");
    //   $(".content").hide();
    //   $(".photo-card-bg").css("display", "flex");
    //   $(".photo-card-container").css("display", "flex");
    //   $("#ptaToggle .pta-outline").css("fill", "#f3f3f3");
    //   $(".pta-title").css("display", "inline-block");
    //   // alert('showPhotos');
    // }

    // function showArticle() {
    //   $(".content").show();
    //   $(".cover").addClass("show-article");
    //   $(".content").addClass("show-article-content");
    //   $(".photo-card-bg").hide();
    //   $(".photo-card-container").hide();
    //   $("#ptaToggle .pta-outline").css("fill", "");
    //   $(".pta-title").css("display", "none");
    //   // alert('showArticle');
    // }

    function isInChina(cb) {
      var url = "//graph.facebook.com/feed?callback=h";
      var xhr = new XMLHttpRequest();
      var called = false;
      xhr.open("GET", url);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          called = true;
          cb(false);
        }
      };
      xhr.send();
      // timeout 1s, this facebook API is very fast.
      setTimeout(function () {
        if (!called) {
          xhr.abort();
          cb(true);
        }
      }, 1000);
    }
  })(jQuery);
}

(function () {
  if (!document.getElementById("zen-toggle-switch-btn")) {
  } else {
    // 命名空间变量
    const zenToggleSwitch = document.getElementById("zen-toggle-switch-btn");
    const zenToggleBothBtn = document.getElementById("zen-toggle-both-btn");
    const zenToggleGroups = {
      camera: zenToggleSwitch.querySelector(".zen-toggle-camera-only"),
      text: zenToggleSwitch.querySelector(".zen-toggle-text-only"),
    };
    let zenToggleState = "text"; // camera, text, both

    function zenToggleSetState(s) {
      zenToggleGroups.camera.classList.remove("zen-toggle-group-active");
      zenToggleGroups.text.classList.remove("zen-toggle-group-active");
      zenToggleBothBtn.classList.remove("zen-toggle-btn-active");

      if (s === "both") {
        // 两栏布局：同时显示文章和照片
        zenToggleBothBtn.classList.add("zen-toggle-btn-active");
        zenToggleState = "both";
        // 右侧切换器显示"文章"图标（表示可以切换到仅文章模式）
        zenToggleGroups.camera.classList.remove("zen-toggle-group-active");
        zenToggleGroups.text.classList.add("zen-toggle-group-active");

        $("body").css("overflow", ""); // 恢复body滚动
        $(".content").show();
        $(".cover").removeClass("show-article");
        $(".content").removeClass("show-article-content");
        $(".photo-card-bg").css("display", "none");
        $(".photo-card-container").css("display", "none");
        $(".pta-title").css("display", "none");
      }

      if (s === "camera") {
        // 仅照片模式：隐藏文章，只显示照片
        zenToggleGroups.text.classList.add("zen-toggle-group-active");
        zenToggleState = "camera";

        $("body").css("overflow", "hidden"); // 禁止body滚动
        $(".content").hide();
        $(".cover").removeClass("show-article");
        $(".content").removeClass("show-article-content");
        $(".photo-card-bg").css("display", "flex");
        $(".photo-card-container").css("display", "flex");
        $(".pta-title").css("display", "block");
      }

      if (s === "text") {
        // 仅文章模式：隐藏照片，只显示文章
        zenToggleGroups.camera.classList.add("zen-toggle-group-active");
        zenToggleState = "text";
        $("body").css("overflow", ""); // 恢复body滚动
        $(".content").show();
        $(".cover").addClass("show-article");
        $(".content").addClass("show-article-content");
        $(".photo-card-bg").css("display", "none");
        $(".photo-card-container").css("display", "none");
        $(".pta-title").css("display", "none");
      }
    }

    // 右侧SVG切换：在both和camera之间切换
    zenToggleSwitch.onclick = () => {
      if (zenToggleState === "text") zenToggleSetState("camera");
      else zenToggleSetState("text");
    };

    // 左侧按钮：切换到仅文章模式
    zenToggleBothBtn.onclick = () => zenToggleSetState("both");

    // 默认两栏布局
    zenToggleSetState("both");
  }
})();
