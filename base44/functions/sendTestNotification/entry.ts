Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("PUSHALERT_API_KEY");
    if (!apiKey) return Response.json({ error: "No PushAlert API key" }, { status: 500 });

    const paRes = await fetch("https://api.pushalert.co/rest/v1/send", {
      method: "POST",
      headers: {
        "Authorization": `api_key=${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        title: "🔔 Test Notification",
        message: "Notifications are working! INSOMNIACSGMRS.COM",
        url: "https://mist.insomniacsgmrs.com",
        icon: "https://insomniacsgmrs.com/uploads/mist-icon.png",
        sound: "https://insomniacsgmrs.com/uploads/notification.mp3",
      }).toString(),
    });

    const paData = await paRes.text();
    console.log("PushAlert test response:", paRes.status, paData);

    return Response.json({ ok: paRes.ok, status: paRes.status, detail: paData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});