using MediatR;
using Microsoft.AspNetCore.Mvc;
using PersianCustomers.Core.Application.Features.Client.Commands;
using PersianCustomers.Core.Application.Features.Client.Queries;

namespace PersianCustomers.EndPoints.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VoipController : ControllerBase
    {
        private readonly IMediator _mediator;

        public VoipController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetClients([FromQuery] GetCallRecordByDateQuery query)
        {
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

       


    }
}
