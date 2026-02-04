using MediatR;
using Microsoft.AspNetCore.Mvc;
using PersianCustomers.Core.Application.Features.Client.Commands;
using PersianCustomers.Core.Application.Features.Client.Queries;

namespace PersianCustomers.EndPoints.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ClientController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetClients([FromQuery] GetAllClientsQuery query)
        {
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClient(long id)
        {
            var query = new GetClientByIdQuery(id);
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateClient([FromBody] CreateClientCommand command)
        {
            var result = await _mediator.Send(command);
            return result.IsSuccess ? CreatedAtAction(nameof(GetClient), new { id = result.Data }, result) : BadRequest(result);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateClient([FromBody] UpdateClientCommand command)
        {

            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                if (result.Message.Contains("not found"))
                    return NotFound(result);
                return BadRequest(result);
            }

            return Ok(result);
        }


    }
}
