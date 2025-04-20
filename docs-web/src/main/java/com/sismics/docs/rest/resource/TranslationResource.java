package com.sismics.docs.rest.resource;

import com.sismics.docs.core.service.TranslationService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.json.JSONObject;

@Path("/translate")
@Produces(MediaType.APPLICATION_JSON)
public class TranslationResource {

    private final TranslationService translationService;

    public TranslationResource() {
        this.translationService = new TranslationService();
    }

    @POST
    @Path("text")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public Response translate(@FormParam("text") String text, @FormParam("targetLang") String targetLang) {
        try {
            // 验证输入
            if (text == null || text.trim().isEmpty() || targetLang == null || targetLang.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new JSONObject().put("error", "Text and target language must not be empty").toString())
                        .build();
            }

            // 调用翻译服务
            String translatedText = translationService.translateText(text, targetLang);

            // 构建响应
            JSONObject response = new JSONObject();
            response.put("translatedText", translatedText);

            return Response.ok(response.toString())
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new JSONObject().put("error", "Translation failed: " + e.getMessage()).toString())
                    .build();
        }
    }
}
