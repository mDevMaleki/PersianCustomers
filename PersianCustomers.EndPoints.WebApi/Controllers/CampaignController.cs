using MediatR;
using Microsoft.AspNetCore.Mvc;
using PersianCustomers.Core.Application.Features.Campaign.Commands;
using PersianCustomers.Core.Application.Features.Campaign.Queries;

namespace PersianCustomers.EndPoints.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CampaignController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CampaignController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetCampaigns([FromQuery] GetAllCampaignsQuery query)
        {
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCampaign(long id)
        {
            var query = new GetCampaignByIdQuery(id);
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignCommand command)
        {
            var result = await _mediator.Send(command);
            return result.IsSuccess ? CreatedAtAction(nameof(GetCampaign), new { id = result.Data }, result) : BadRequest(result);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateCampaign([FromBody] UpdateCampaignCommand command)
        {
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                if (result.Message.Contains("not found"))
                {
                    return NotFound(result);
                }

                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCampaign(long id)
        {
            var command = new DeleteCampaignCommand(id);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                if (result.Message.Contains("not found"))
                {
                    return NotFound(result);
                }

                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
