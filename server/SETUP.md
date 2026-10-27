# Connect Arnold

Text import works immediately without an account or key. Screenshot reading and AI questions require this local service. This is a development setup; the Mac must be awake and on the same trusted Wi-Fi as your phone. A hosted authenticated HTTPS backend is still needed for independent everyday AI access away from the Mac.

1. Create an API key in your OpenAI API account and enable API billing. A ChatGPT subscription does not fund API usage. Never paste the key into chat or enter it in the phone app.
2. From the Setline repository folder, copy `server/.env.example` to `server/.env.local`. Put your key after `OPENAI_API_KEY=`. That local file is ignored by Git. Do not use an `EXPO_PUBLIC_` variable for secrets.
3. In a terminal:

   ```sh
   # Run from the Setline repository folder:
   npm run arnold
   ```

4. Open `.expo/arnold-service.json` on the Mac. Copy its `pairingCode` into Arnold → Connection settings on your phone. This code authorizes requests to the local service; it is NOT the OpenAI key. It changes when the service restarts unless `SETLINE_ARNOLD_TOKEN` is set on the server.
5. Enter `http://YOUR_MAC_WIFI_IP:8091` as the service URL. Use `http://localhost:8091` for a browser on the Mac. Save the connection. Use a trusted private network; this local prototype uses HTTP, not encrypted internet transport.
6. Try Read with Arnold with a short note, review the resulting draft, and approve it. For screenshots, choose an image then explicitly tap Read. Simply choosing an image does not upload it.

The server sends only the supplied notes/image, or your question with the eight most recent saved workouts, to OpenAI Responses with `store:false`. When no history exists, chat sends notebook references explicitly labeled as references. It has no tools and cannot change stored workouts. The server does not write request text/images to disk or log them. Images are temporary in app memory; drafts, source text, the latest 12 question/reply pairs, and connection settings are saved locally, separately from the training backup. Drafts can be replaced by creating a new draft. Each question is independent, not a threaded conversation.

This prototype limits requests to 3/minute and 30/hour, and two concurrent requests. Large imports may need to be split. A missing key, connection error, rejected request or incomplete extraction changes no workout history. Set an API spending budget in your account. Keep your existing notebook until you have verified the import and exported a training backup.

## Review rules

- Import one workout at a time. If AI sees multiple workouts, it is instructed to extract the first and warn.
- Confirm exercise names, categories, units, modes, every set and the actual date.
- Link an exercise to the same existing library exercise to combine its history.
- `added` means attached weight, `label` preserves plate shorthand, `timed` uses seconds.
- A routine can contain blank values to fill during training. Saving history requires all sets to have valid values.
- Weekdays without a calendar date stay undated. Undated references never become completed workouts automatically.
- A draft cannot be approved twice, but importing the same source as a new draft can duplicate history. Review before approving.

Official API references: https://developers.openai.com/api/docs/guides/images-vision and https://developers.openai.com/api/docs/guides/structured-outputs.
