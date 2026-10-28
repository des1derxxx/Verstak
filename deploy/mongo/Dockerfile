FROM mongo:8.0
# Baked in rather than bind-mounted: Coolify does not carry repository files to the host.
COPY entrypoint.sh healthcheck.sh init.sh /opt/verstak/
