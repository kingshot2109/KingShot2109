FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish KingshotRecruitment.Api.csproj -c Release -o /publish
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ConnectionStrings__Applications="Data Source=/data/applications.db"
EXPOSE 8080
ENTRYPOINT ["dotnet", "KingshotRecruitment.Api.dll"]
