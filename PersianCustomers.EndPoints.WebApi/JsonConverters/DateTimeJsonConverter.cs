using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PersianCustomers.EndPoints.WebApi.JsonConverters
{
    public class DateTimeJsonConverter : JsonConverter<DateTime>
    {
        private static readonly string[] SupportedFormats =
        {
            "yyyy-MM-dd",
            "yyyy/MM/dd",
            "yyyy-MM-ddTHH:mm:ss",
            "yyyy-MM-ddTHH:mm:ss.FFF",
            "yyyy-MM-ddTHH:mm:ssZ",
            "yyyy-MM-ddTHH:mm:ss.FFFZ",
            "O"
        };

        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var value = reader.GetString();
                if (string.IsNullOrWhiteSpace(value))
                {
                    return default;
                }

                if (DateTime.TryParseExact(value, SupportedFormats, CultureInfo.InvariantCulture,
                        DateTimeStyles.RoundtripKind | DateTimeStyles.AllowWhiteSpaces, out var parsedExact))
                {
                    return parsedExact;
                }

                if (DateTime.TryParse(value, CultureInfo.InvariantCulture,
                        DateTimeStyles.RoundtripKind | DateTimeStyles.AllowWhiteSpaces, out var parsed))
                {
                    return parsed;
                }
            }

            throw new JsonException("Invalid date format.");
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString("O", CultureInfo.InvariantCulture));
        }
    }
}
