using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StockMovementTrackerSystem.Api.Validations;
using StockMovementTrackerSystem.Application.Interfaces;
using StockMovementTrackerSystem.Infrastructure.Interceptors;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.Infrastructure.Services;
using System.Net.Mime;
using System.Text;
using System.Text.Json.Serialization;

namespace StockMovementTrackerSystem.Api.Extensions;

public static class ServiceCollectionExtension
{
    public static IServiceCollection AddDbAndIdentityConfig(this IServiceCollection services,
        IConfiguration configuration)
    {
        _ = services.AddSingleton<EntityDbCommandInterceptor>();

        // Project DbContext --SQL Server Connection
        _ = services.AddDbContextPool<StockMovementTrackerSystemDbContext>((provider, options) =>
        {
            EntityDbCommandInterceptor interceptor = provider.GetRequiredService<EntityDbCommandInterceptor>();

            _ = options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            _ = options.AddInterceptors(interceptor);
        });

        // Project Store Procedure DbContext --SQL Server Connection
        // _ = services.AddDbContext<ES_HRDbSPContext>(opt =>
        //     opt.UseSqlServer(configuration.GetConnectionString("DefaultConnection")).EnableSensitiveDataLogging());

        // Identity DbContext -- SQL Server Connection
        _ = services.AddDbContextPool<ApplicationDbContext>((provider, options) =>
        {
            EntityDbCommandInterceptor interceptor = provider.GetRequiredService<EntityDbCommandInterceptor>();

            _ = options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            _ = options.AddInterceptors(interceptor);
        });

        _ = services.AddIdentity<IdentityUser, IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddTokenProvider<DataProtectorTokenProvider<IdentityUser>>("Admin");

        services.Configure<IdentityOptions>(options =>
        {
            options.Tokens.ProviderMap.Add("Default", new TokenProviderDescriptor(
                typeof(DataProtectorTokenProvider<IdentityUser>)));
            options.Tokens.EmailConfirmationTokenProvider = "Default";
        });

        return services;
    }

    public static IServiceCollection AddMiscConfig(this IServiceCollection services)
    {
        _ = services.AddControllers()
            .AddJsonOptions(x => { x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; })
            // Custom Model State Validation Response Message
            .ConfigureApiBehaviorOptions(options =>
            {
                options.SuppressModelStateInvalidFilter = false;
                options.InvalidModelStateResponseFactory = context =>
                {
                    ValidationFailedResult result = new(context.ModelState);
                    result.ContentTypes.Add(MediaTypeNames.Application.Json);
                    return result;
                };
            });

        _ = services.AddOpenApi(options => { _ = options.UseJwtBearerAuthentication(); });

        // Add Miscellaneous
        _ = services.AddHttpContextAccessor();

        // API Lower Case Url
        _ = services.AddRouting(options => options.LowercaseUrls = true);

        // Enable Cors
        _ = services.AddCors(options =>
        {
            options.AddPolicy(name: "AllowedCorsOrigins",
                builder =>
                {
                    _ = builder
                        .SetIsOriginAllowed(GLOBAL.IsOriginAllowed)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
        });

        return services;
    }

    public static IServiceCollection AddJWTAuthConfig(this IServiceCollection services, IConfiguration configuration)
    {
        // Adding JWT Authentication  
        _ = services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            // Adding Jwt Bearer  
            .AddJwtBearer(options =>
            {
                options.SaveToken = true;
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidAudience = configuration["JWT:ValidAudience"],
                    ValidIssuer = configuration["JWT:ValidIssuer"],
                    IssuerSigningKey =
                        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWT:Secret"] ?? "")),
                    ClockSkew = TimeSpan.FromDays(1)
                };
            });

        _ = services.AddAuthorization(options =>
        {
            //options.AddPolicy("Master_Company_Policy", p => p.RequireClaim("Master_Company", ["Read", "Write", "Full Access"]));
            //options.AddPolicy("ReadAccess", p => p.RequireClaim("Master_Read", "Company"));
            //options.AddPolicy("Write Access", p => p.RequireClaim("Master_Write", ["Company", "Branch"]));
        });

        return services;
    }

    public static IServiceCollection AddCoreScopedConfig(this IServiceCollection services)
    {
        _ = services.AddScoped<ITokenBuilder, TokenBuilder>();
        _ = services.AddScoped<IRandomizer, Randomizer>();
        _ = services.AddSingleton<IEncryptionService, EncryptionService>();
        //_ = services.AddScoped<IIdGenerateService, IdGenerateService>();
        // _ = services.AddScoped<IFirebaseNotification, FirebaseNotification>();

        // _ = services.AddScoped<ISP_RepositoryWrapper, SP_RepositoryWrapper>();

        _ = services.AddAntiforgery();

        return services;
    }
}