(() => {
  "use strict";
  const DATA = window.CITATION_DATA;
  const sources = DATA.sources.map(d => ({...d}));
  const excerpts = DATA.excerpts;
  const sourceById = new Map(sources.map(d => [d.id,d]));
  const excerptById = new Map(excerpts.map(d => [d.id,d]));
  const colors = {local:"#876b50",academic:"#776d83",media:"#53748a",official:"#607d69",memorial:"#9a5149"};
  let language = "en";
  let selectedSource = null;
  let selectedExcerpt = null;
  let hoveredSource = null;
  let simulation, svg, linkSelection, nodeSelection, labelSelection;
  let width = 800, height = 520;

  const $ = s => document.querySelector(s);
  const isZh = () => language === "zh";
  const nameOf = d => isZh() ? d.zh : d.name;
  const excerptName = d => isZh() ? d.zhLabel : d.label;
  const text = (en, zh) => isZh() ? zh : en;

  function setLanguage(next) {
    language = next;
    document.documentElement.lang = language;
    document.querySelectorAll("[data-en][data-zh]").forEach(el => {
      el.textContent = el.dataset[language];
    });
    document.querySelectorAll(".essay").forEach(el => {
      el.hidden = el.dataset.lang !== language;
    });
    if (labelSelection) labelSelection.text(d => nameOf(d));
    if (selectedSource) renderSourcePanel(sourceById.get(selectedSource));
    else if (selectedExcerpt) renderExcerptPanel(excerptById.get(selectedExcerpt));
    renderExcerptButtons();
    renderReferences();
    updateGraphStatus();
  }

  function buildLinks() {
    const links = [];
    for (let i=0;i<sources.length;i++) {
      for (let j=i+1;j<sources.length;j++) {
        const a=sources[i], b=sources[j];
        const shared=a.excerptIds.filter(id=>b.excerptIds.includes(id));
        if (shared.length) links.push({source:a.id,target:b.id,shared,value:shared.length});
      }
    }
    return links;
  }
  const links = buildLinks();

  function renderGraph() {
    const element = $("#network");
    const rect = element.getBoundingClientRect();
    width = Math.max(320, rect.width || 800);
    height = window.matchMedia("(max-width: 600px)").matches ? 430 : 520;
    element.setAttribute("viewBox",`0 0 ${width} ${height}`);
    element.innerHTML = "";
    svg = d3.select(element);
    const root = svg.append("g");
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id","soft-shadow").attr("x","-40%").attr("y","-40%").attr("width","180%").attr("height","180%");
    filter.append("feDropShadow").attr("dx",0).attr("dy",2).attr("stdDeviation",2).attr("flood-color","#342d25").attr("flood-opacity",.15);

    const linkWidth = d3.scaleLinear().domain([1, d3.max(links,d=>d.value)||1]).range([1.1,4.5]);
    linkSelection = root.append("g").selectAll("line").data(links).join("line")
      .attr("class","link").attr("stroke-width",d=>linkWidth(d.value));
    nodeSelection = root.append("g").selectAll("g").data(sources).join("g")
      .attr("class","node").attr("tabindex",0).attr("role","button")
      .attr("aria-label",d=>`${d.name}, ${d.excerptIds.length} excerpt groups`)
      .on("pointerenter",(event,d)=>{hoveredSource=d.id;applyHighlight();})
      .on("pointerleave",()=>{hoveredSource=null;applyHighlight();})
      .on("click",(event,d)=>{event.stopPropagation();selectSource(d.id);})
      .on("keydown",(event,d)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectSource(d.id);}});
    nodeSelection.append("circle")
      .attr("r",d=>8+d.excerptIds.length*3.1)
      .attr("fill",d=>colors[d.category])
      .attr("filter","url(#soft-shadow)");
    labelSelection=nodeSelection.append("text")
      .attr("x",d=>13+d.excerptIds.length*1.1).attr("y",4)
      .text(d=>nameOf(d));
    simulation=d3.forceSimulation(sources)
      .force("link",d3.forceLink(links).id(d=>d.id).distance(d=>Math.max(100,175-d.value*12)).strength(.42))
      .force("charge",d3.forceManyBody().strength(-330))
      .force("center",d3.forceCenter(width/2,height/2))
      .force("collide",d3.forceCollide(d=>22+d.excerptIds.length*2.4))
      .force("x",d3.forceX(width/2).strength(.035))
      .force("y",d3.forceY(height/2).strength(.045))
      .on("tick",()=>{
        sources.forEach(d=>{
          d.x=Math.max(38,Math.min(width-38,d.x));
          d.y=Math.max(34,Math.min(height-34,d.y));
        });
        linkSelection.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
        nodeSelection.attr("transform",d=>`translate(${d.x},${d.y})`);
      });
    nodeSelection.call(d3.drag()
      .on("start",(event,d)=>{if(!event.active)simulation.alphaTarget(.25).restart();d.fx=d.x;d.fy=d.y;})
      .on("drag",(event,d)=>{d.fx=event.x;d.fy=event.y;})
      .on("end",(event,d)=>{if(!event.active)simulation.alphaTarget(0);d.fx=null;d.fy=null;}));
    svg.on("click",()=>clearSelection());
    applyHighlight();
  }

  function applyHighlight() {
    const focusSource=hoveredSource || selectedSource;
    const focusExcerpt=selectedExcerpt;
    linkSelection
      .classed("is-active",d=>{
        if(focusExcerpt) return d.shared.includes(focusExcerpt);
        if(focusSource) return d.source.id===focusSource||d.target.id===focusSource;
        return false;
      })
      .classed("is-muted",d=>{
        if(focusExcerpt) return !d.shared.includes(focusExcerpt);
        if(focusSource) return d.source.id!==focusSource&&d.target.id!==focusSource;
        return false;
      });
    nodeSelection
      .classed("is-active",d=>{
        if(focusExcerpt) return d.excerptIds.includes(focusExcerpt);
        return focusSource===d.id;
      })
      .classed("is-muted",d=>{
        if(focusExcerpt) return !d.excerptIds.includes(focusExcerpt);
        if(focusSource) return d.id!==focusSource;
        return false;
      });
  }

  function updateGraphStatus() {
    const el=$("#graph-status");
    if(selectedSource) el.textContent=text("Selected source: ","当前来源：")+nameOf(sourceById.get(selectedSource));
    else if(selectedExcerpt) el.textContent=text("Selected excerpt: ","当前摘录：")+selectedExcerpt;
    else el.textContent=text("Select a source to inspect its excerpts","选择一个来源，查看其收录的摘录");
  }

  function selectSource(id) {
    selectedSource=id; selectedExcerpt=null;
    renderSourcePanel(sourceById.get(id));
    renderExcerptButtons();
    applyHighlight(); updateGraphStatus();
  }
  function selectExcerpt(id) {
    selectedExcerpt=id; selectedSource=null;
    renderExcerptPanel(excerptById.get(id));
    renderExcerptButtons();
    applyHighlight(); updateGraphStatus();
  }
  function clearSelection() {
    selectedSource=null;selectedExcerpt=null;hoveredSource=null;
    $("#panel-content").innerHTML=`<p class="panel-placeholder">${text("Choose a node in the network, or select an excerpt below it. The source record and the passages currently associated with it will appear here.","点击网络中的节点，或选择下方的一组摘录。这里将显示来源记录及目前与其关联的文本片段。")}</p>`;
    $("#panel-index").textContent="—";
    $("#clear-selection").hidden=true;
    renderExcerptButtons();applyHighlight();updateGraphStatus();
  }

  function renderSourcePanel(source) {
    const ref=DATA.references.find(r=>r.id===source.referenceId);
    const heading=isZh()?source.zh:source.name;
    const items=source.excerptIds.map(id=>{
      const e=excerptById.get(id);
      return `<li><button type="button" data-excerpt="${e.id}"><span class="record-id">${e.id}</span><span class="record-name">${excerptName(e)}</span><span class="record-count">↗</span></button></li>`;
    }).join("");
    $("#panel-index").textContent=source.id;
    $("#panel-content").innerHTML=`
      <h3 class="panel-title">${heading}</h3>
      <p class="panel-meta">${source.kind} · ${source.date}</p>
      <p class="panel-description">${source.note||text("Source record in the working dataset.","工作数据集中的来源记录。")}</p>
      <p class="record-label">${text("ASSOCIATED EXCERPTS","关联摘录")} / ${source.excerptIds.length}</p>
      <ul class="record-list">${items}</ul>
      <p class="record-label">${text("REFERENCE","参考资料")}</p>
      <p class="source-note">${ref?ref.title:"—"} · ${ref?ref.status:""}</p>`;
    $("#panel-content").querySelectorAll("[data-excerpt]").forEach(btn=>btn.addEventListener("click",()=>selectExcerpt(btn.dataset.excerpt)));
    $("#clear-selection").hidden=false;
  }

  function renderExcerptPanel(excerpt) {
    const present=sources.filter(s=>s.excerptIds.includes(excerpt.id));
    const html=present.map(s=>`<li><button type="button" data-source="${s.id}"><span class="record-id">${s.id}</span><span class="record-name">${nameOf(s)}</span><span class="record-count">${s.excerptIds.length}</span></button></li>`).join("");
    $("#panel-index").textContent=excerpt.id;
    $("#panel-content").innerHTML=`
      <h3 class="panel-title">${excerptName(excerpt)}</h3>
      <p class="panel-meta">${excerpt.id} · ${present.length} ${text("sources","个来源")}</p>
      <p class="record-label">${text("CHINESE TRANSCRIPTION · WORKING DRAFT","中文转录 · 工作稿")}</p>
      <p class="passage">${excerpt.zh}</p>
      <p class="record-label">${text("ENGLISH TRANSLATION · WORKING DRAFT","英文翻译 · 工作稿")}</p>
      <p class="passage-translation">${excerpt.en}</p>
      <p class="source-note">${excerpt.attribution}. ${excerpt.note}</p>
      <p class="record-label">${text("APPEARS IN","出现于")} / ${present.length}</p>
      <ul class="record-list">${html}</ul>`;
    $("#panel-content").querySelectorAll("[data-source]").forEach(btn=>btn.addEventListener("click",()=>selectSource(btn.dataset.source)));
    $("#clear-selection").hidden=false;
  }

  function renderExcerptButtons() {
    $("#excerpt-buttons").innerHTML=excerpts.map(e=>`
      <button type="button" class="excerpt-button ${selectedExcerpt===e.id?"selected":""}" data-id="${e.id}" aria-pressed="${selectedExcerpt===e.id}">
        <strong>${e.id}</strong><span>${excerptName(e)}</span>
      </button>`).join("");
    $("#excerpt-buttons").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>selectExcerpt(btn.dataset.id)));
  }

  function renderReferences() {
    $("#reference-list").innerHTML=DATA.references.map(r=>`
      <li>
        <div>
          <span class="reference-title">${r.title}</span>
          <span class="reference-detail">${r.detail}</span>
          ${r.url?`<span class="reference-detail"><a href="${r.url}" target="_blank" rel="noopener noreferrer">${text("Open source ↗","打开来源 ↗")}</a></span>`:""}
        </div>
        <span class="reference-status">${r.status}</span>
      </li>`).join("");
  }

  $("#language-toggle").addEventListener("click",()=>setLanguage(isZh()?"en":"zh"));
  $("#reset-button").addEventListener("click",()=>{
    clearSelection();
    if(simulation) simulation.alpha(.65).restart();
  });
  $("#clear-selection").addEventListener("click",clearSelection);

  let resizeTimer;
  window.addEventListener("resize",()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      if(simulation) simulation.stop();
      renderGraph();
    },180);
  });

  renderReferences();
  renderExcerptButtons();
  renderGraph();
})();
