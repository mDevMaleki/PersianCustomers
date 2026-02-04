using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PersianCustomers.Core.Application.Common.Models
{
    public class BaseResponse<T>
    {
        public bool IsSuccess { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string> Errors { get; set; } = new();

        public static BaseResponse<T> Success(T data, string message = "Success")
            => new() { IsSuccess = true, Data = data, Message = message };

        public static BaseResponse<T> Failure(string message, List<string>? errors = null)
            => new() { IsSuccess = false, Message = message, Errors = errors ?? new List<string>() };
    }
}
