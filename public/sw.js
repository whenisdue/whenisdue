self.addEventListener("push", (event) => {
  const fallback = {
    title: "Authority Engine Alert",
    body: "A new verified date has been posted.",
    url: "/directory",
    icon: "/icons/icon-192.png",
  };

  event.waitUntil(
    (async () => {
      let payload = fallback;
      if (event.data) {
        try {
          payload = { ...fallback, ...event.data.json() };
        } catch {
          payload = { ...fallback, body: event.data.text() || fallback.body };
        }
      }

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || fallback.icon,
        data: { url: payload.url },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  // Construct the secure target URL
  const base = self.location.origin;
  const targetUrl = new URL(event.notification.data?.url || "/", base);

  // Append PostHog / Google Analytics tracking parameters
  targetUrl.searchParams.set("utm_source", "webpush");
  targetUrl.searchParams.set("utm_medium", "push");

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(base) && "focus" in client) {
          client.navigate(targetUrl.toString());
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl.toString());
      }
    })
  );
});