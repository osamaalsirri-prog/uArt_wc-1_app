package com.uart.wc01;

import android.app.Activity;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;

/** Optional online assistant. No device commands, persistent keys, or automatic telemetry. */
public final class OnlineAssistant {
    private final Activity activity;
    private final WebView view;
    private final AtomicBoolean busy = new AtomicBoolean();
    OnlineAssistant(Activity activity, WebView view) { this.activity=activity; this.view=view; }
    @JavascriptInterface public void ask(String key, String model, String question) {
        if (!busy.compareAndSet(false,true)) return;
        new Thread(() -> {
            boolean success=false;
            String result="Online request failed. Check Internet and API account.";
            HttpsURLConnection connection=null;
            try {
                if(key==null || key.length()<10 || key.length()>256 || !key.matches("[A-Za-z0-9_.-]+")
                    || model==null || !model.matches("[A-Za-z0-9_.:-]{1,64}")
                    || question==null || question.trim().isEmpty() || question.length()>4000) {
                    throw new IllegalArgumentException();
                }
                ConnectivityManager cm=(ConnectivityManager)activity.getSystemService(Context.CONNECTIVITY_SERVICE);
                Network selected=null;
                if(cm!=null) for(Network net:cm.getAllNetworks()){
                    NetworkCapabilities caps=cm.getNetworkCapabilities(net);
                    if(caps!=null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                        && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)){selected=net;break;}
                }
                if(selected==null){result="No validated Internet connection. Enable mobile data or Internet Wi-Fi."; }
                else {
                    URL url=new URL("https://api.openai.com/v1/chat/completions");
                    connection=(HttpsURLConnection)selected.openConnection(url);
                    connection.setInstanceFollowRedirects(false);
                    connection.setConnectTimeout(12000);connection.setReadTimeout(35000);
                    connection.setRequestMethod("POST");connection.setDoOutput(true);
                    connection.setRequestProperty("Authorization","Bearer "+key);
                    connection.setRequestProperty("Content-Type","application/json");
                    JSONArray messages=new JSONArray();
                    messages.put(new JSONObject().put("role","system").put("content","You are the read-only uArt WC-01 welding controller assistant. Answer in the user's language, including Egyptian Arabic. Never execute commands, bypass interlocks, or claim measured machine states. Controller V7.3.11 HOME GPIO34 active HIGH; END GPIO12 active HIGH NC to GND. Distinguish estimates from facts. No automatic changes."));
                    messages.put(new JSONObject().put("role","user").put("content",question));
                    byte[] body=new JSONObject().put("model",model).put("messages",messages).put("max_completion_tokens",1000).toString().getBytes(StandardCharsets.UTF_8);
                    try(java.io.OutputStream out=connection.getOutputStream()){out.write(body);}
                    int code=connection.getResponseCode();
                    if(code==200){
                        try(InputStream in=connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                            byte[] buffer=new byte[4096];int count;
                            while((count=in.read(buffer))!=-1){if(out.size()+count>262144)throw new java.io.IOException();out.write(buffer,0,count);}
                            JSONObject json=new JSONObject(new String(out.toByteArray(),StandardCharsets.UTF_8));
                            result=json.getJSONArray("choices").getJSONObject(0).getJSONObject("message").optString("content","");
                            success=!result.trim().isEmpty();
                            if(!success)result="The online model returned no text.";
                        }
                    }else result="Online API error "+code+". Check key, model access, quota or billing. Local assistant remains available.";
                }
            }catch(Exception ignored){}finally{
                if(connection!=null)connection.disconnect();
                busy.set(false);
                final String script="window.__wc01OnlineAnswer && window.__wc01OnlineAnswer("+success+","+JSONObject.quote(result)+")";
                activity.runOnUiThread(()->{if(!activity.isFinishing()&&!activity.isDestroyed())view.evaluateJavascript(script,null);});
            }
        },"WC01-online").start();
    }
}
