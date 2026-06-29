using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;

namespace StockMovementTrackerSystem.Api.Extensions;

public static class OpenApiTransformersExtension
{
    public static OpenApiOptions UseJwtBearerAuthentication(this OpenApiOptions options)
    {
        options.OpenApiVersion = Microsoft.OpenApi.OpenApiSpecVersion.OpenApi3_0;
        options.CreateSchemaReferenceId = OpenApiOptions.CreateDefaultSchemaReferenceId;

        // 1. Document Transformer - API Info နှင့် Security Scheme ထည့်ခြင်း
        options.AddDocumentTransformer((document, context, cancellationToken) =>
        {
            document.Info = new Microsoft.OpenApi.OpenApiInfo
            {
                Version = "v1",
                Title = "ES LAB API",
                Description = "API for processing auth for users."
            };

            document.Components ??= new Microsoft.OpenApi.OpenApiComponents();
            document.Components.SecuritySchemes ??= new Dictionary<string, Microsoft.OpenApi.IOpenApiSecurityScheme>();

            // Bearer Security Scheme ကို သတ်မှတ်ခြင်း
            document.Components.SecuritySchemes["Bearer"] = new Microsoft.OpenApi.OpenApiSecurityScheme
            {
                Type = Microsoft.OpenApi.SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = Microsoft.OpenApi.ParameterLocation.Header,
                Description = "Enter Bearer followed by your valid JWT token."
            };

            return Task.CompletedTask;
        });

        options.AddOperationTransformer((operation, context, cancellationToken) =>
        {
            if (context.Description.ActionDescriptor.EndpointMetadata.OfType<IAuthorizeData>().Any())
            {
                operation.Security ??= new List<Microsoft.OpenApi.OpenApiSecurityRequirement>();

                var document = context.Document;

                var requirement = new Microsoft.OpenApi.OpenApiSecurityRequirement
                {
                    // OpenApiSecuritySchemeReference ကို Microsoft.OpenApi.OpenApiSecuritySchemeReference အဖြစ် အပြည့်အစုံ ရေးပေးရပါမည်
                    [new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document, null)] = []
                };

                operation.Security.Add(requirement);
            }

            return Task.CompletedTask;
        });

        return options;
    }
}