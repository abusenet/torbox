/**
 * A User
 * @typedef {Object} User
 * @property {string} username
 * @property {string} password
 * @property {string[]} folders - list of folders the user has access.
 */

/**
 * Lists of users with access to this backend.
 * @type {User[]}
 */
const USERS = [
  // {
  //   username: "foo",
  //   password: "bar",
  //   folders: [
  //     "/Big Buck Bunny/",
  //     "/Tears of Steel/",
  //   ],
  // },
];

/**
 * Gets the user authorized for this request.
 * @param {Request} request 
 * @returns {Response}
 */
function auth(request) {
  let authorization = request.headers.get("Authorization");

  const authResponse = new Response("401 Unauthorized", {
    status: 401,
    statusText: "Unauthorized",
    headers: {
      "WWW-Authenticate": `Basic realm="Login", charset="UTF-8"`,
    },
  });
    
  if (!authorization) {
    return authResponse;
  }

  const [, base64 = ""] = authorization.match(/^Basic\s+(.*)$/) || [];
  const [username, password] = atob(base64).split(":");

  if (!username && !password) {
    return authResponse;
  }
  
  const user = USERS.find((user) => {
    return user.username === username && user.password === password;
  });

  if (!user) {
    return authResponse;
  }

  return Response.json(user);
}

/**
 * Lists folders available for the authorized user.
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function home(request) {
  let response = auth(request);
  if (!response.ok) return response;
  const user = await response.json();

  const html = `<table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Size</th>
      </tr>
    </thead>
    <tbody>
    ${user.folders.map((folder) => {
      const segments = folder.split("/").filter(Boolean);
      folder = segments.at(-1);

      return `<tr>
        <td>
          <a href="/${folder}/">${folder}</a>
        </td>
        <td>Directory</td>
        <td>-</td>
      </tr>`;
    }).join("\n")}
    </tbody>
  </table>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/**
 * 
 * @param {Request} request 
 * @param {Object} env 
 * @returns {Promise<Response>}
 */
async function item(request, env) {
  let response = auth(request);
  if (!response.ok) return response;
  /**
   * @type {User}
   */
  const user = await response.json();

  const { pathname } = new URL(request.url);
  const [ parent, ] = pathname.split("/").filter(Boolean);
  
  const folder = user.folders.find((folder) => folder.endsWith(`/${parent}/`));
  if (!folder) {
    return new Response("Not Found", {
      status: 404,
    });
  }

  const url = new URL(`https://webdav.torbox.app`);
  url.pathname = pathname.replace(new RegExp(`^/${parent}/`), folder);

  const authorization = btoa(`${env.USERNAME}:${env.PASSWORD}`);
  request = new Request(url, request);
  request.headers.set("Authorization", `Basic ${authorization}`);
  response = await fetch(request);

  const rewriter = new HTMLRewriter();
  
  // Cleans up the HTML for listing page.
  if (response.headers.get("Content-Type")?.includes("text/html")) {
    rewriter.onDocument({
      comments(comment) {
        comment.remove();
      },
    });
    rewriter.on("head,body>header,body>div:first-of-type,script", {
      element(element) {
        element.remove();
      },
    });
  }

  response = rewriter.transform(response);

  if (pathname.endsWith(".mkv")) {
    // Chrome needs this changed to play MKV.
    response.headers.set("Content-Type", "video/webm");
  }

  return response;
}

// Entry point
export default {
  /**
   * 
   * @param {Request} request 
   * @param {Object} env 
   * @param {Object} ctx 
   * @returns 
   */
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname === "/") {
      return home(request);
    }

    return item(request, env);
  },
};