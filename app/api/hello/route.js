
export async function POST(request) {
    const {name} = request;
    return new Response(`Hello World ${name}`, { status: 200 });
  }
  