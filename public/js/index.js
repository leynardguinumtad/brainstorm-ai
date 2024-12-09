let list_selected_texts = []; // Ensure this array is populated before calling llm

// ===========================================================================
// Function to display a list of text inside the specified container
function displayTextInContainer(textList)
{
  // Update the global list_selected_texts
  list_selected_texts = textList;

  // Get the container element
  const container = document.getElementById('rawTextContainer');
  if (!container)
  {
    console.error('Element with ID "rawTextContainer" not found.');
    return;
  }

  // Clear the container of any existing content
  container.innerHTML = '';

  // Add the title back to the container
  const title = document.createElement('p');
  title.className = 'text-center';
  title.textContent = 'Raw Texts';
  container.appendChild(title);

  // Create a list element to hold the texts
  const list = document.createElement('ul');
  list.style.listStyleType = 'none'; // Remove bullet points for a clean look
  list.style.padding = '0'; // Remove padding

  // Populate the list with text items
  textList.forEach(text =>
  {
    const listItem = document.createElement('li');
    listItem.textContent = text;
    listItem.style.marginBottom = '0.5rem'; // Add spacing between items
    list.appendChild(listItem);
  });

  // Append the list to the container
  container.appendChild(list);

}

// ===========================================================================
// Function to handle the LLM process
async function llm()
{
  const responseDiv = document.getElementById('transformedTextContainer');
  if (!responseDiv)
  {
    console.error('Element with ID "transformedTextContainer" not found.');
    return;
  }

  responseDiv.innerHTML = ''; // Clear previous responses

  try
  {
    // Send the list_selected_texts array to the server
    // Use absolute URL for fetch and EventSource
    const response = await fetch('http://localhost:3000/brainstorm1/start-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list_selected_texts }),
    });



    if (!response.ok)
    {
      responseDiv.innerHTML = `<p><em>Error occurred while initiating the stream: ${response.statusText}</em></p>`;
      return;
    }

    // Open SSE connection for the streamed response
    // const eventSource = new EventSource('/llm-stream');
    const eventSource = new EventSource('http://localhost:3000/brainstorm1/llm-stream');

    eventSource.onmessage = function (event)
    {
      responseDiv.innerHTML += event.data; // Append chunk to the response div
    };

    eventSource.onerror = function ()
    {
      responseDiv.innerHTML += '<p><em>Error occurred while receiving the response.</em></p>';
      eventSource.close();
    };
  } catch (error)
  {
    console.error('Error during fetch or SSE connection:', error);
    responseDiv.innerHTML = `<p><em>Unexpected error occurred: ${error.message}</em></p>`;
  }
}

// ===========================================================================
let currentPage = null;

function changePage(oldPage, newPage)
{
  if (oldPage != null)
  {
    oldPage.style("display", "none");
  }
  if (newPage != null)
  {
    newPage.style("display", "unset");
  }
}
// ===========================================================================
drag = (simulation) =>
{
  function dragstarted(event)
  {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event)
  {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event)
  {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};

height = 600;
width = 600;

const dataLinks = {};
const dataNodes = {};

let simulation = null;

const svg = d3
  .select("#svgcontainer")
  .append("svg")
  .style("flex-grow", "1")
  .attr("viewBox", [0, 0, 800, 800]);
svg.call(
  d3.zoom().on("zoom", function ({ transform })
  {
    container.attr("transform", transform);
  })
);

let container = svg.append("g");

let link = container
  .append("g")
  .attr("stroke", "#333")
  .attr("stroke-opacity", 0.3)
  .attr("stroke-width", 5)
  .attr("fill", "transparent")
  .attr("stroke-linecap", "round")
  .selectAll("path");
let node = container
  .append("g")
  .style("text-anchor", "middle")
  .style("dominant-baseline", "central")
  .classed("noselect", true)
  .selectAll("text");
function update()
{
  let links = Object.values(dataLinks);
  let nodes = Object.values(dataNodes);

  simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(300)
    )
    .force("charge", d3.forceManyBody().strength(-1500))
    .force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2));

  //console.log(links);

  link = link
    .data(links)
    .join("path")
    //.attr("marker-end", "url(#triangle)")
    .on("click", (e, d) =>
    {
      loadWikiPage(d.source.id, d.linkId);
      //console.log(d.linkId);
    });

  link.each(function (d, i)
  {
    d3.select(this)
      .selectAll("title")
      .data([links[i]])
      .enter()
      .append("title")
      .html((d) => `Link from "${d.source.id}" to "${d.target.id}"`);
  });

  node = node
    .data(nodes)
    .join("text")
    .text((d) => d.id)
    .call(drag(simulation))
    .on("click", (e, d) =>
    {
      loadWikiPage(d.id);
    });

  simulation.on("tick", () =>
  {
    link.attr("d", (d) =>
    {
      const O = new Vec2(d.source.x, d.source.y);
      const T = new Vec2(d.target.x, d.target.y);

      const U = T.subV(O).normalize();
      const R = new Vec2(-U.y, U.x);

      const RShift = R.mulS(6);
      const UShift = U.mulS(20);
      const centerShift = R.mulS(15);

      const center = O.lerp(T, 0.5).addV(centerShift);


      return `
                    M ${O.addV(UShift).addV(RShift).toArray()}
                    Q ${O.lerp(T, 0.3).addV(centerShift).toArray()}
                    ${center.toArray()}
                    T ${T.subV(UShift).addV(RShift).toArray()}
                    
                    M ${center.addV(R.mulS(-10)).addV(U.mulS(-10)).toArray()}
                    L ${center.addV(R.mulS(0)).addV(U.mulS(10)).toArray()}
                    L ${center.addV(R.mulS(10)).addV(U.mulS(-10)).toArray()}
                `;
    });

    node.attr("x", (d) => d.x).attr("y", (d) => d.y);
  });
}

function addLink(source, target, linkId)
{
  let key = `${source}[to]${target}`;
  if (!(key in dataLinks))
  {
    dataLinks[key] = { source: source, target: target, linkId: linkId };

    return true;
  }

  return false;
}

function nodeColor(highlightTitel)
{
  node = node.attr("fill", (d) =>
  {
    if (d.id == highlightTitel)
    {
      return "green";
    }
    return "black";
  });
}

function updateLink()
{
  d3.select("#shareA").attr(
    "href",
    `${location.origin}${location.pathname}?pageids=${Object.values(dataNodes)
      .map((d) => d.pageid)
      .join("|")}`
  );
}

function validId(titel)
{
  titel = titel
    .replace(/ /g, "_")
    .replace(/^[^a-z]|[^\w:-]/gi, (m) => m.charCodeAt(0));
  return titel[0].match(/\d/) == null ? titel : `N${titel}`;
}

let linkFrom = {};
/*
If (x in linkFrom[y]) then there is a link to the page y in the page x.
linkFrom[y] contain all the pages with links to page y.
*/

let pageContainer = d3.select("#pageContainer");

function loadWikiPage(titel, scrollTo, eraseforwardStack = true)
{
  titel = titel.replace(/_/g, " ");

  let pr = null;

  if (!(titel in dataNodes))
  {
    pr = d3
      .html(`https://en.wikipedia.org/api/rest_v1/page/html/${titel}`)
      .then(function (data)
      {
        if (currentPage != null) currentPage.style("display", "none");

        currentPage = pageContainer.append("div").attr("id", validId(titel));
        currentPage.node().append(data.documentElement);

        if (simulation != null) simulation.stop();
        let pageid = currentPage
          .select("meta[property$=pageId]")
          .attr("content");
        dataNodes[titel] = { id: titel, pageid: pageid }; // , "x": 0, "y": 0, "vx": 0, "vy": 0

        updateLink();

        currentPage
          .select("body")
          .style("height", "auto")
          .style("overflow", "visible")
          .style("background-color", "#fff")
          .insert("h4", ":first-child")
          .style("font-size", "28.8px")
          .style("margin-top", "0px")
          .attr("class", "firstHeading")
          .attr("id", "firstHeading")
          .html(titel);

        currentPage.selectAll("a").each(function ()
        {
          let last = d3.select(this).attr("href");

          let mat = last.match(
            /^(?:(?:(?:https?:)?\/\/en\.wikipedia\.org\/wiki)|\.)\/([^#/]+)(?:#(.+))?/
          );

          const linkTitel = mat != null ? mat[1].replace(/_/g, " ") : "";

          if (mat != null)
          {
            d3.select(this)
              .attr(
                "href",
                `javascript:loadWikiPage(\`${linkTitel}\`, ${typeof mat[2] === "undefined" ? "undefined" : `\`${mat[2]}\``
                });`
              )
              .on("click", function (event)
              {
                event.preventDefault(); // Prevent default link behavior

                // Get the clicked link's parent element
                const parentText = event.target.parentElement.textContent;

                // Extract the sentence containing the clicked link
                const regex = /[^.!?]*[.!?]/g; // Regex to split text into sentences
                const sentences = parentText.match(regex);
                const clickedLinkText = event.target.textContent;

                // Find the sentence with the link
                const sentenceWithLink = sentences.find((sentence) =>
                  sentence.includes(clickedLinkText)
                );

                if (sentenceWithLink)
                {
                  list_selected_texts.push(sentenceWithLink.trim());
                  console.log(list_selected_texts);
                  //display in the container
                  displayTextInContainer(list_selected_texts);
                  llm();
                }

                // Load the new Wikipedia page
                loadWikiPage(linkTitel);
              });

            if (linkTitel != titel)
            {
              if (linkTitel in linkFrom)
              {
              } else
              {
                linkFrom[linkTitel] = {};
              }

              let id = d3.select(this).attr("id");

              if (!(titel in linkFrom[linkTitel]))
              {
                if (id == null)
                {
                  id = validId(titel + " to " + linkTitel);
                  d3.select(this).attr("id", id);
                }
                linkFrom[linkTitel][titel] = id;
              }

              if (linkTitel in dataNodes)
              {
                addLink(titel, linkTitel, id);
              }
            }
          } else
          {
            d3.select(this).attr("target", "_blank");
          }
        });

      })
      .then(function ()
      {
        Object.keys(dataNodes).forEach((e) =>
        {
          if (e in linkFrom)
          {
            Object.entries(linkFrom[e]).forEach((l) =>
            {
              //console.log(`get linkFrom[${e}][${l[0]}] = ${l[1]}`);
              addLink(l[0], e, l[1]);
            });
          }
        });

        update();
      });
  } else
  {
    pr = Promise.resolve().then(function ()
    {
      let newPage = d3.select(`#pageContainer > #${validId(titel)}`);

      changePage(currentPage, newPage);

      currentPage = newPage;
    });
  }

  pr.then(function ()
  {
    currentPage
      .selectAll(".highlight-yellow")
      .classed("highlight-yellow", false);

    nodeColor(titel);

    d3.select("#openInWikipediaA").attr("href", `./${titel}`);

    backStack.push([titel, scrollTo]);
    backButton.property("disabled", backStack.length < 2);
    deleteButton.property("disabled", false);

    if (eraseforwardStack)
    {
      forwardStack = [];
      forwardButton.property("disabled", true);
    }

    if (typeof scrollTo !== "undefined")
    {
      //console.log(scrollTo);

      currentPage
        .select(`#${scrollTo}`)
        .classed("highlight-yellow", true)
        .node()
        .scrollIntoView();
    } else
    {
      currentPage.node().scrollTop = 0;
    }
  });
}

let params = new URLSearchParams(location.search);
/*
    "pageids"
    "pages"
*/

let pr = null;
if (params.has("pageids"))
{
  pr = d3
    .json(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&pageids=${params.get(
        "pageids"
      )}`
    )
    .then((data) =>
    {
      return Object.values(data.query.pages).map((d) => d.title);
    });
} else if (params.has("pages"))
{
  pr = Promise.resolve().then(() =>
  {
    return params.get("pages").split("|");
  });
}

if (pr != null)
{
  pr.then((initPages) =>
  {
    initPages.forEach((p) =>
    {
      loadWikiPage(p);
    });
  });
}




let backStack = [];
let forwardStack = [];

const backButton = d3.select("#backButton");
const forwardButton = d3.select("#forwardButton");

backButton.on("click", () =>
{
  forwardStack.push(backStack.pop());

  const page = backStack.pop();
  loadWikiPage(page[0], page[1], false);

  forwardButton.property("disabled", false);
});

forwardButton.on("click", () =>
{
  const page = forwardStack.pop();
  loadWikiPage(page[0], page[1], false);

  forwardButton.property("disabled", forwardStack.length < 1);
});

const deleteButton = d3.select("#deleteButton");

deleteButton.on("click", () =>
{
  const titel = backStack.pop()[0];

  delete dataNodes[titel];

  currentPage.remove();

  let linkEntries = Object.entries(dataLinks);
  linkEntries.forEach((e) =>
  {
    if (e[1].source.id == titel || e[1].target.id == titel)
    {
      delete dataLinks[`${e[1].source.id}[to]${e[1].target.id}`];
    }
  });

  const len = backStack.length;

  if (len > 0)
  {
    const page = backStack.pop();
    loadWikiPage(page[0], page[1], false);
  } else
  {
    deleteButton.property("disabled", true);
  }
  backButton.property("disabled", len <= 1);

  updateLink();
  update();
});

