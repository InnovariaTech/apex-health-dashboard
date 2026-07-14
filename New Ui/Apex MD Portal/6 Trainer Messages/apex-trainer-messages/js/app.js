/* APEX Fit — Trainer Messages
 * Renders the identity chip, inbox and conversation thread from APEX_DATA,
 * and wires up the reply composer. Data is provided by js/data.js
 * (generated from /data/*.json via tools/build-data.js).
 */
(function () {
  "use strict";
  var D = window.APEX_DATA;
  if (!D) { console.error("APEX_DATA missing — run: node tools/build-data.js"); return; }

  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var firstName = function (name) { return (name || "").split(" ")[0]; };

  /* ---------- identity chip (top bar) ---------- */
  function renderChip() {
    var p = D.profile, host = document.getElementById("userChip");
    if (!host) return;
    host.innerHTML =
      '<img class="avatar-img" src="' + p.avatar + '" alt="' + p.name + '">' +
      '<div class="user-meta">' +
        '<div class="nm">' + p.name + '</div>' +
        '<div class="sub">MRN ' + p.mrn + ' · ' + p.plan + ' · ' + p.age + ' yrs</div>' +
      '</div>';
  }

  /* ---------- inbox ---------- */
  function renderInbox() {
    var host = document.getElementById("inbox");
    if (!host) return;
    host.innerHTML = "";
    D.inbox.forEach(function (t) {
      var row = el("div", "thread" + (t.active ? " active" : ""));
      var name = t.name +
        (t.tag ? ' <span class="tag">' + t.tag + "</span>" : "") +
        (t.unread ? ' <span class="unread-dot"></span>' : "");
      row.innerHTML =
        '<div class="thread-top">' +
          '<span class="thread-name">' + name + "</span>" +
          '<span class="thread-time">' + t.time + "</span>" +
        "</div>" +
        '<div class="thread-prev"></div>';
      row.querySelector(".thread-prev").textContent = t.preview;
      host.appendChild(row);
    });
  }

  /* ---------- conversation header ---------- */
  function renderConvoHead() {
    var c = D.conversation.trainer, host = document.getElementById("convoHead");
    if (!host) return;
    host.innerHTML =
      '<img class="avatar-img convo-av" src="' + c.avatar + '" alt="' + c.name + '">' +
      '<div style="flex:1">' +
        '<div class="nm">' + c.name + "</div>" +
        '<div class="st">' + c.status + "</div>" +
      "</div>" +
      '<div class="pager">' +
        '<span class="meta showing">Showing ' + D.conversation.showing + "</span>" +
        '<button aria-label="Newer"><svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<button aria-label="Older"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6"/></svg></button>' +
      "</div>";
  }

  /* ---------- message bubble ---------- */
  function bubble(m) {
    var c = D.conversation.trainer, p = D.profile, out = m.from === "you";
    var wrap = el("div", "msg " + (out ? "out" : "in"));
    var avatar = out
      ? '<div class="av-sm">' + p.initials + "</div>"
      : '<img class="av-sm-img" src="' + c.avatar + '" alt="' + firstName(c.name) + '">';
    wrap.innerHTML =
      avatar +
      '<div class="b-wrap">' +
        '<div class="meta"><b>' + (out ? "You" : firstName(c.name)) + "</b>" +
          '<span class="t">' + m.time + "</span></div>" +
        '<div class="bubble"></div>' +
      "</div>";
    wrap.querySelector(".bubble").textContent = m.text;
    return wrap;
  }

  /* ---------- thread ---------- */
  function renderThread() {
    var host = document.getElementById("threadList");
    if (!host) return;
    host.innerHTML = "";
    D.conversation.timeline.forEach(function (item) {
      if (item.day) {
        host.appendChild(el("div", "day-sep", "<span>" + item.day + "</span>"));
      } else {
        host.appendChild(bubble(item));
      }
    });
    host.scrollTop = host.scrollHeight;
  }

  /* ---------- composer ---------- */
  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function wireComposer() {
    var reply = document.getElementById("reply"),
        sendBtn = document.getElementById("sendBtn"),
        list = document.getElementById("threadList");
    if (!reply || !sendBtn) return;

    reply.addEventListener("input", function () {
      reply.style.height = "auto";
      reply.style.height = Math.min(reply.scrollHeight, 120) + "px";
    });
    function send() {
      var text = reply.value.trim();
      if (!text) return;
      list.appendChild(bubble({ from: "you", time: nowTime(), text: text }));
      reply.value = "";
      reply.style.height = "auto";
      list.scrollTop = list.scrollHeight;
    }
    sendBtn.addEventListener("click", send);
    reply.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); send(); }
    });
  }

  renderChip();
  renderInbox();
  renderConvoHead();
  renderThread();
  wireComposer();
})();
