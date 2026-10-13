using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Domain.Entities;

namespace StockMovementTrackerSystem.Infrastructure.Persistence;

public partial class StockMovementTrackerSystemDbContext : DbContext
{
    public StockMovementTrackerSystemDbContext(DbContextOptions<StockMovementTrackerSystemDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AspNetRole> AspNetRoles { get; set; }

    public virtual DbSet<AspNetRoleClaim> AspNetRoleClaims { get; set; }

    public virtual DbSet<AspNetUser> AspNetUsers { get; set; }

    public virtual DbSet<AspNetUserClaim> AspNetUserClaims { get; set; }

    public virtual DbSet<AspNetUserLogin> AspNetUserLogins { get; set; }

    public virtual DbSet<AspNetUserToken> AspNetUserTokens { get; set; }

    public virtual DbSet<ProductStock> ProductStocks { get; set; }

    public virtual DbSet<StockAlert> StockAlerts { get; set; }

    public virtual DbSet<StockAuditLog> StockAuditLogs { get; set; }

    public virtual DbSet<StockMovement> StockMovements { get; set; }

    public virtual DbSet<TokenClaim> TokenClaims { get; set; }

    public virtual DbSet<UserInformation> UserInformations { get; set; }

    public virtual DbSet<ViProductStockSummary> ViProductStockSummaries { get; set; }

    public virtual DbSet<ViUserInformation> ViUserInformations { get; set; }

    public virtual DbSet<ChatConversation> ChatConversations { get; set; }

    public virtual DbSet<ChatMessage> ChatMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AspNetRole>(entity =>
        {
            entity.HasIndex(e => e.NormalizedName, "RoleNameIndex")
                .IsUnique()
                .HasFilter("([NormalizedName] IS NOT NULL)");

            entity.Property(e => e.Name).HasMaxLength(256);
            entity.Property(e => e.NormalizedName).HasMaxLength(256);
        });

        modelBuilder.Entity<AspNetRoleClaim>(entity =>
        {
            entity.HasIndex(e => e.RoleId, "IX_AspNetRoleClaims_RoleId");

            entity.HasOne(d => d.Role).WithMany(p => p.AspNetRoleClaims).HasForeignKey(d => d.RoleId);
        });

        modelBuilder.Entity<AspNetUser>(entity =>
        {
            entity.HasIndex(e => e.NormalizedEmail, "EmailIndex");

            entity.HasIndex(e => e.NormalizedUserName, "UserNameIndex")
                .IsUnique()
                .HasFilter("([NormalizedUserName] IS NOT NULL)");

            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.UserName).HasMaxLength(256);

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "AspNetUserRole",
                    r => r.HasOne<AspNetRole>().WithMany().HasForeignKey("RoleId"),
                    l => l.HasOne<AspNetUser>().WithMany().HasForeignKey("UserId"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId");
                        j.ToTable("AspNetUserRoles");
                        j.HasIndex(new[] { "RoleId" }, "IX_AspNetUserRoles_RoleId");
                    });
        });

        modelBuilder.Entity<AspNetUserClaim>(entity =>
        {
            entity.HasIndex(e => e.UserId, "IX_AspNetUserClaims_UserId");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserClaims).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AspNetUserLogin>(entity =>
        {
            entity.HasKey(e => new { e.LoginProvider, e.ProviderKey });

            entity.HasIndex(e => e.UserId, "IX_AspNetUserLogins_UserId");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserLogins).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AspNetUserToken>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LoginProvider, e.Name });

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserTokens).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<ProductStock>(entity =>
        {
            entity.HasKey(e => e.ProductId);

            entity.Property(e => e.ProductId).HasMaxLength(50);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.LastUpdatedDate).HasColumnType("datetime");
            entity.Property(e => e.ProductName).HasMaxLength(150);
        });

        modelBuilder.Entity<StockAlert>(entity =>
        {
            entity.HasKey(e => e.AlertId);

            entity.Property(e => e.AlertId).HasMaxLength(50);
            entity.Property(e => e.AlertMessage).HasMaxLength(250);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.ProductId).HasMaxLength(50);

            entity.HasOne(d => d.Product).WithMany(p => p.StockAlerts)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StockAlerts_ProductStocks");
        });

        modelBuilder.Entity<StockAuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditLogId);

            entity.Property(e => e.AuditLogId).HasMaxLength(50);
            entity.Property(e => e.ActionByUserId).HasMaxLength(250);
            entity.Property(e => e.LogTimestamp).HasColumnType("datetime");
            entity.Property(e => e.MovementType).HasMaxLength(150);
            entity.Property(e => e.ProductId).HasMaxLength(50);

            entity.HasOne(d => d.Product).WithMany(p => p.StockAuditLogs)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StockAuditLogs_ProductStocks");
        });

        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.HasKey(e => e.MovementId);

            entity.Property(e => e.MovementId).HasMaxLength(50);
            entity.Property(e => e.MovementDate).HasColumnType("datetime");
            entity.Property(e => e.ProductId).HasMaxLength(50);
            entity.Property(e => e.Type).HasMaxLength(150);

            entity.HasOne(d => d.Product).WithMany(p => p.StockMovements)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StockMovements_ProductStocks");
        });

        modelBuilder.Entity<TokenClaim>(entity =>
        {
            entity.HasKey(e => e.UserId);

            entity.ToTable("TokenClaim");

            entity.Property(e => e.UserId).HasMaxLength(250);
            entity.Property(e => e.RefreshDate).HasColumnType("datetime");
            entity.Property(e => e.TokenExpiry).HasColumnType("datetime");
        });

        modelBuilder.Entity<UserInformation>(entity =>
        {
            entity.HasKey(e => e.UserId);

            entity.ToTable("UserInformation");

            entity.Property(e => e.UserId).HasMaxLength(256);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.CreatedBy).HasMaxLength(250);
            entity.Property(e => e.CreatedOn).HasColumnType("datetime");
            entity.Property(e => e.FullName).HasMaxLength(250);
            entity.Property(e => e.TerminateDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy).HasMaxLength(250);
            entity.Property(e => e.UpdatedOn).HasColumnType("datetime");
        });

        modelBuilder.Entity<ViProductStockSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("VI__ProductStockSummary");

            entity.Property(e => e.MovementDate).HasColumnType("datetime");
            entity.Property(e => e.MovementId).HasMaxLength(50);
            entity.Property(e => e.ProductId).HasMaxLength(50);
            entity.Property(e => e.ProductName).HasMaxLength(150);
            entity.Property(e => e.Type).HasMaxLength(150);
        });

        modelBuilder.Entity<ViUserInformation>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("VI_UserInformation");

            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.CreatedBy).HasMaxLength(250);
            entity.Property(e => e.CreatedOn).HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.FullName).HasMaxLength(250);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.Name).HasMaxLength(256);
            entity.Property(e => e.TerminateDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy).HasMaxLength(250);
            entity.Property(e => e.UpdatedOn).HasColumnType("datetime");
            entity.Property(e => e.UserId).HasMaxLength(256);
            entity.Property(e => e.UserName).HasMaxLength(256);
        });

        modelBuilder.Entity<ChatConversation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId, "IX_ChatConversations_UserId");
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.UserId).HasMaxLength(256);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ConversationId, "IX_ChatMessages_ConversationId");
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Role).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Conversation)
                .WithMany(p => p.ChatMessages)
                .HasForeignKey(d => d.ConversationId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ChatMessages_ChatConversations");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
