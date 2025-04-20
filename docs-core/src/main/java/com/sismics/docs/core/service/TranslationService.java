package com.sismics.docs.core.service;

import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.client.HttpClient;
import org.apache.http.entity.StringEntity;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;

public class TranslationService {

    private static final String API_URL = "https://api-free.deepl.com/v2/translate";
    private static final String AUTH_KEY = "a1326ab2-d7ed-4c37-898f-3613ab09feb8:fx";

    public String translateText(String originalText, String targetLang) throws IOException {
        // 验证输入参数
        if (originalText == null || originalText.trim().isEmpty() || targetLang == null || targetLang.trim().isEmpty()) {
            throw new IOException("Text and target language must not be empty");
        }

        // 创建 Http 客户端
        HttpClient client = HttpClients.createDefault();
        HttpPost post = new HttpPost(API_URL);

        // 设置请求头
        post.setHeader("Content-Type", "application/x-www-form-urlencoded");

        // 对参数进行 URL 编码
        String encodedAuthKey = URLEncoder.encode(AUTH_KEY, StandardCharsets.UTF_8.toString());
        String encodedText = URLEncoder.encode(originalText, StandardCharsets.UTF_8.toString());
        String encodedLang = URLEncoder.encode(targetLang, StandardCharsets.UTF_8.toString());

        // 构建 form-urlencoded 参数
        String params = String.format("auth_key=%s&text=%s&target_lang=%s",
                encodedAuthKey, encodedText, encodedLang);

        // 打印请求参数
        System.out.println("DeepL Request: " + params);

        StringEntity entity = new StringEntity(params, StandardCharsets.UTF_8);
        post.setEntity(entity);

        // 执行请求
        org.apache.http.HttpResponse response = client.execute(post);
        int statusCode = response.getStatusLine().getStatusCode();
        String responseString = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);

        // 打印响应
        System.out.println("DeepL HTTP Status: " + statusCode);
        System.out.println("DeepL Response: " + responseString);

        // 检查状态码
        if (statusCode != 200) {
            throw new IOException("DeepL API error, status: " + statusCode + ", response: " + responseString);
        }

        // 验证响应格式
        if (responseString == null || responseString.trim().isEmpty()) {
            throw new IOException("Empty response from DeepL API");
        }
        if (!responseString.trim().startsWith("{")) {
            throw new IOException("Invalid JSON response from DeepL: " + responseString);
        }

        // 解析 JSON
        JSONObject jsonResponse = new JSONObject(responseString);

        // 提取翻译文本
        if (jsonResponse.has("translations")) {
            return jsonResponse.getJSONArray("translations")
                              .getJSONObject(0)
                              .getString("text");
        } else {
            throw new IOException("Unexpected response format: " + responseString);
        }
    }
}
